from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.crypto import get_random_string
from django.utils.text import slugify
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
import random

from .models import Farm, Product, ProductVariant, ProductReview, BlogPost
from .serializers import (
    FarmSerializer, 
    FarmDetailSerializer, 
    ProductSerializer, 
    ProductReviewSerializer, 
    BlogPostSerializer
)
from traceability.models import Batch, EnvData
from traceability.serializers import BatchTraceSerializer
from traceability.services import generate_qr_code, calculate_eco_score


class IsFarmOwnerOrReadOnly(permissions.BasePermission):
    """
    Quy tắc phân quyền: Cho phép mọi người xem (GET, HEAD, OPTIONS),
    nhưng chỉ chủ trang trại (farm.owner) mới được sửa/xóa/đổi ảnh bìa.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and obj.owner == request.user)


class FarmViewSet(viewsets.ModelViewSet):
    queryset = Farm.objects.all().prefetch_related('products')
    serializer_class = FarmSerializer
    permission_classes = [IsFarmOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return FarmDetailSerializer
        return FarmSerializer

    # Hỗ trợ tìm kiếm Farm theo cả ID số nguyên lẫn chuỗi Slug
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        if str(lookup_value).isdigit():
            obj = get_object_or_404(queryset, pk=int(lookup_value))
        else:
            obj = get_object_or_404(queryset, slug=lookup_value)

        self.check_object_permissions(self.request, obj)
        return obj

    def retrieve(self, request, pk=None):
        farm = self.get_object()
        return Response(FarmDetailSerializer(farm, context={'request': request}).data)

    def partial_update(self, request, *args, **kwargs):
        farm = self.get_object()
        serializer = FarmSerializer(farm, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(FarmDetailSerializer(farm, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'put'], url_path='my-farm', permission_classes=[permissions.IsAuthenticated])
    def my_farm(self, request):
        user = request.user
        farm = Farm.objects.filter(owner=user).first()
        if not farm:
            farm = Farm.objects.filter(name__icontains=user.username).first()
            if farm:
                farm.owner = user
                farm.save(update_fields=['owner'])
            else:
                farm = Farm.objects.create(
                    owner=user,
                    name=f"Nông Trại {user.username}",
                    slug=slugify(f"nong-trai-{user.username}"),
                    description="Trang trại sinh thái hữu cơ ứng dụng quy trình VietGAP.",
                    address=getattr(user, 'address', '') or "Đà Lạt, Lâm Đồng",
                    latitude=11.9404,
                    longitude=108.4583,
                    vietgap_cert_id=f"VG-{get_random_string(6).upper()}",
                )

        if request.method == 'PUT':
            serializer = FarmSerializer(farm, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(FarmDetailSerializer(farm, context={'request': request}).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(FarmDetailSerializer(farm, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='my-products', permission_classes=[permissions.IsAuthenticated])
    def my_products(self, request):
        user = request.user
        farm = Farm.objects.filter(owner=user).first() or Farm.objects.filter(name__icontains=user.username).first()
        products = Product.objects.filter(farm=farm).order_by('-created_at') if farm else []
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)

    # Đăng bán nông sản
    @action(detail=False, methods=['post'], url_path='add-product', permission_classes=[permissions.IsAuthenticated])
    def add_product(self, request):
        user = request.user
        farm = Farm.objects.filter(owner=user).first() or Farm.objects.filter(name__icontains=user.username).first()
        if not farm:
            farm = Farm.objects.create(owner=user, name=f"Nông Trại {user.username}", address="Đà Lạt, Lâm Đồng")

        name = request.data.get('name')
        category = request.data.get('category', 'Rau ăn lá')
        price = request.data.get('price')
        unit = request.data.get('unit', 'kg')
        stock_quantity = int(request.data.get('stock_quantity', 50))
        image_url = request.data.get('image_url')
        description = request.data.get('description', '')
        image_file = request.FILES.get('image')

        if not name or not price:
            return Response({"error": "Tên và giá sản phẩm là bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo slug duy nhất
        base_slug = slugify(name) or f"sp-{get_random_string(4).lower()}"
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        product = Product.objects.create(
            farm=farm,
            name=name,
            slug=slug,
            category=category,
            price=price,
            unit=unit,
            stock_quantity=stock_quantity,
            image_url=image_url if not image_file else '',
            image=image_file,
            description=description,
            status=Product.Status.APPROVED,
            is_active=True
        )

        # Tự động tạo lô mẫu
        today = timezone.now().date()
        batch_code = f"LOT-{get_random_string(6).upper()}"
        batch = Batch.objects.create(
            product=product,
            batch_code=batch_code,
            quantity=stock_quantity,
            planting_date=today - timedelta(days=45),
            harvest_date=today,
            eco_score=95.0,
            eco_grade='A'
        )

        for i in range(7):
            EnvData.objects.create(
                batch=batch,
                temperature=round(random.uniform(22.0, 26.5), 1),
                humidity=round(random.uniform(68.0, 78.0), 1),
                soil_moisture=round(random.uniform(65.0, 75.0), 1),
                soil_ph=round(random.uniform(6.2, 6.8), 2),
                recorded_at=timezone.now() - timedelta(days=(6 - i))
            )

        try:
            score, grade = calculate_eco_score(batch)
            batch.eco_score = score
            batch.eco_grade = grade
            batch.save(update_fields=['eco_score', 'eco_grade'])
            generate_qr_code(batch)
        except Exception as e:
            print("Lỗi tạo mã QR:", e)

        return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_201_CREATED)

    # Chỉnh sửa sản phẩm
    @action(detail=True, methods=['put', 'patch'], url_path='edit-product', permission_classes=[permissions.IsAuthenticated])
    def edit_product(self, request, pk=None):
        lookup = Q(pk=pk) if str(pk).isdigit() else Q(slug=pk)
        product = get_object_or_404(Product, lookup, farm__owner=request.user)
        
        product.name = request.data.get('name', product.name)
        product.category = request.data.get('category', product.category)
        product.price = request.data.get('price', product.price)
        product.unit = request.data.get('unit', product.unit)
        product.stock_quantity = request.data.get('stock_quantity', product.stock_quantity)
        product.description = request.data.get('description', product.description)
        
        if 'image' in request.FILES:
            product.image = request.FILES['image']
        elif 'image_url' in request.data:
            product.image_url = request.data.get('image_url')

        product.save()
        return Response(ProductSerializer(product, context={'request': request}).data)

    # Xóa sản phẩm
    @action(detail=True, methods=['delete'], url_path='delete-product', permission_classes=[permissions.IsAuthenticated])
    def delete_product(self, request, pk=None):
        lookup = Q(pk=pk) if str(pk).isdigit() else Q(slug=pk)
        product = get_object_or_404(Product, lookup, farm__owner=request.user)
        product_name = product.name
        product.delete()
        return Response({"message": f"Đã xóa thành công sản phẩm '{product_name}'"}, status=status.HTTP_200_OK)

    # Tạm dừng bán / Mở bán lại
    @action(detail=True, methods=['post'], url_path='toggle-active', permission_classes=[permissions.IsAuthenticated])
    def toggle_active(self, request, pk=None):
        lookup = Q(pk=pk) if str(pk).isdigit() else Q(slug=pk)
        product = get_object_or_404(Product, lookup, farm__owner=request.user)
        product.is_active = not product.is_active
        product.save(update_fields=['is_active'])
        state_str = "đang mở bán" if product.is_active else "đã tạm dừng bán"
        return Response({"message": f"Sản phẩm {state_str}", "is_active": product.is_active}, status=status.HTTP_200_OK)

    # Tạo lô mới
    @action(detail=False, methods=['post'], url_path='create-batch', permission_classes=[permissions.IsAuthenticated])
    def create_batch(self, request):
        product_id = request.data.get('product_id')
        raw_quantity = str(request.data.get('quantity', '100'))
        digits_only = ''.join(c for c in raw_quantity if c.isdigit())
        quantity_num = int(digits_only) if digits_only else 100

        lookup = Q(pk=product_id) if str(product_id).isdigit() else Q(slug=product_id)
        product = Product.objects.filter(lookup, farm__owner=request.user).first()
        if not product:
            return Response({"error": "Sản phẩm không thuộc quyền quản lý của bạn."}, status=status.HTTP_400_BAD_REQUEST)

        batch_code = f"LOT-{get_random_string(6).upper()}"
        batch = Batch.objects.create(
            product=product,
            batch_code=batch_code,
            quantity=quantity_num,
            planting_date=request.data.get('planting_date'),
            harvest_date=request.data.get('harvest_date'),
            eco_score=95.0,
            eco_grade='A'
        )

        product.stock_quantity += quantity_num
        product.is_active = True
        product.save(update_fields=['stock_quantity', 'is_active'])

        base_t = float(request.data.get('init_temp', 24.5))
        base_h = float(request.data.get('init_hum', 72.0))
        base_sm = float(request.data.get('init_soil_m', 68.0))
        base_ph = float(request.data.get('init_ph', 6.5))

        for i in range(7):
            EnvData.objects.create(
                batch=batch,
                temperature=round(base_t + random.uniform(-1.5, 1.5), 1),
                humidity=round(base_h + random.uniform(-3.0, 3.0), 1),
                soil_moisture=round(base_sm + random.uniform(-2.5, 2.5), 1),
                soil_ph=round(base_ph + random.uniform(-0.2, 0.2), 2),
                recorded_at=timezone.now() - timedelta(days=(6 - i))
            )

        try:
            score, grade = calculate_eco_score(batch)
            batch.eco_score = score
            batch.eco_grade = grade
            batch.save(update_fields=['eco_score', 'eco_grade'])
            generate_qr_code(batch)
        except Exception as e:
            print("Lỗi tạo QR:", e)

        return Response(BatchTraceSerializer(batch).data, status=status.HTTP_201_CREATED)

    # Cập nhật tồn kho qua file CSV
    @action(detail=False, methods=['post'], url_path='import-inventory', permission_classes=[permissions.IsAuthenticated])
    def import_inventory(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "Vui lòng chọn file CSV tồn kho."}, status=status.HTTP_400_BAD_REQUEST)

        import csv, io
        try:
            decoded_file = file_obj.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(decoded_file))
            updated_count = 0

            for row in reader:
                p_id = row.get('product_id') or row.get('id') or row.get('slug')
                add_qty = row.get('stock') or row.get('quantity')
                if p_id and add_qty:
                    lookup = Q(pk=p_id) if str(p_id).isdigit() else Q(slug=p_id)
                    prod = Product.objects.filter(lookup, farm__owner=request.user).first()
                    if prod:
                        qty = int(add_qty)
                        prod.stock_quantity = qty
                        prod.is_active = (qty > 0)
                        prod.save(update_fields=['stock_quantity', 'is_active'])
                        updated_count += 1

            return Response({"message": f"Đã cập nhật tồn kho thành công cho {updated_count} sản phẩm!"})
        except Exception as e:
            return Response({"error": f"Lỗi đọc file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(status=Product.Status.APPROVED).select_related('farm').prefetch_related('batches', 'variants', 'reviews')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.action == 'list':
            return Product.objects.filter(status=Product.Status.APPROVED, is_active=True).select_related('farm').prefetch_related('batches', 'variants', 'reviews')
        return super().get_queryset()

    # Tìm kiếm linh hoạt theo cả ID số nguyên lẫn chuỗi Slug
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        if str(lookup_value).isdigit():
            obj = get_object_or_404(queryset, pk=int(lookup_value))
        else:
            obj = get_object_or_404(queryset, Q(slug=lookup_value) | Q(name__iexact=lookup_value))

        self.check_object_permissions(self.request, obj)
        return obj

    # 1. Khách gửi đánh giá
    @action(detail=True, methods=['post'], url_path='add-review', permission_classes=[permissions.IsAuthenticated])
    def add_review(self, request, pk=None):
        product = self.get_object()
        user = request.user

        if ProductReview.objects.filter(product=product, user=user).exists():
            return Response({"error": "Bạn đã đánh giá sản phẩm này rồi. Mỗi tài khoản chỉ được đánh giá 1 lần."}, status=status.HTTP_400_BAD_REQUEST)

        rating = int(request.data.get('rating', 5))
        comment = request.data.get('comment', '').strip()

        if not comment:
            return Response({"error": "Vui lòng nhập nội dung đánh giá."}, status=status.HTTP_400_BAD_REQUEST)

        customer_display = user.get_full_name() or user.username or "Khách hàng"
        review = ProductReview.objects.create(
            product=product,
            user=user,
            customer_name=customer_display,
            rating=max(1, min(5, rating)),
            comment=comment
        )
        return Response(ProductReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    # 2. Chủ shop phản hồi đánh giá
    @action(detail=True, methods=['post'], url_path='reply-review', permission_classes=[permissions.IsAuthenticated])
    def reply_review(self, request, pk=None):
        product = self.get_object()
        if product.farm.owner != request.user:
            return Response({"error": "Bạn không có quyền phản hồi đánh giá của sản phẩm này."}, status=status.HTTP_403_FORBIDDEN)

        review_id = request.data.get('review_id')
        reply_content = request.data.get('reply', '').strip()
        if not reply_content:
            return Response({"error": "Nội dung phản hồi không được để trống."}, status=status.HTTP_400_BAD_REQUEST)

        review = get_object_or_404(ProductReview, id=review_id, product=product)
        review.shop_reply = reply_content
        review.replied_at = timezone.now()
        review.save(update_fields=['shop_reply', 'replied_at'])

        return Response(ProductReviewSerializer(review).data, status=status.HTTP_200_OK)

    # 3. Sản phẩm gợi ý
    @action(detail=True, methods=['get'], url_path='recommendations', permission_classes=[permissions.AllowAny])
    def recommendations(self, request, pk=None):
        product = self.get_object()
        
        same_farm = Product.objects.filter(
            farm=product.farm, 
            status=Product.Status.APPROVED, 
            is_active=True
        ).exclude(id=product.id)[:4]

        same_category = Product.objects.filter(
            category=product.category, 
            status=Product.Status.APPROVED, 
            is_active=True
        ).exclude(farm=product.farm).exclude(id=product.id)[:4]

        return Response({
            "same_farm": ProductSerializer(same_farm, many=True, context={'request': request}).data,
            "same_category": ProductSerializer(same_category, many=True, context={'request': request}).data
        })


class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer
    lookup_field = 'slug'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if self.action in ['my_posts', 'destroy', 'update', 'partial_update']:
            if self.request.user.is_authenticated:
                return BlogPost.objects.filter(farm__owner=self.request.user).select_related('farm').prefetch_related('related_products')
        
        return BlogPost.objects.all().select_related('farm').prefetch_related('related_products').order_by('-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_val = self.kwargs.get(self.lookup_field)

        if str(lookup_val).isdigit():
            obj = get_object_or_404(queryset, pk=int(lookup_val))
        else:
            obj = get_object_or_404(queryset, slug=lookup_val)
        
        if self.action == 'retrieve':
            obj.views_count += 1
            obj.save(update_fields=['views_count'])
            
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        farm = Farm.objects.filter(owner=self.request.user).first()
        if not farm:
            farm = Farm.objects.create(
                owner=self.request.user, 
                name=f"Nông Trại {self.request.user.username}"
            )
        serializer.save(farm=farm, is_published=True)

    @action(detail=False, methods=['get'], url_path='my-posts', permission_classes=[permissions.IsAuthenticated])
    def my_posts(self, request):
        posts = BlogPost.objects.filter(farm__owner=request.user).order_by('-created_at')
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)