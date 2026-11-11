from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, F, Q
from django.shortcuts import get_object_or_404
from django.utils.crypto import get_random_string

from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderDetailSerializer
from farms.models import Product


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items__product')
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action in ['retrieve', 'list', 'my_orders', 'vendor_orders']:
            return OrderDetailSerializer
        return OrderCreateSerializer

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        if str(lookup_value).isdigit():
            obj = get_object_or_404(queryset, Q(pk=int(lookup_value)) | Q(order_code=lookup_value))
        else:
            obj = get_object_or_404(queryset, order_code=lookup_value)

        self.check_object_permissions(self.request, obj)
        return obj

    # Tra cứu chi tiết đơn hàng (hỗ trợ cả tìm kiếm trực tiếp trên trang lookup)
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = OrderDetailSerializer(instance, context={'request': request})
        return Response(serializer.data)

    # 1. Khách đặt hàng: Kiểm tra tồn kho & Trừ kho theo trọng lượng thực tế
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        items_data = request.data.get('items', [])
        if not items_data:
            return Response({"error": "Giỏ hàng rỗng."}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra tồn kho của tất cả mặt hàng trước
        for it in items_data:
            p_id = it.get('product_id') or it.get('id')
            qty = int(it.get('quantity', 1))
            multiplier = float(it.get('multiplier_kg', 1.0))
            total_need = qty * multiplier

            product = get_object_or_404(Product, pk=p_id)
            if product.stock_quantity < total_need:
                unit_str = product.unit or 'kg'
                return Response({
                    "error": f"Nông sản '{product.name}' chỉ còn {product.stock_quantity} {unit_str} trong kho, không đủ để cung ứng."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Sinh mã định danh đơn hàng
        order_code = f"ORD-{get_random_string(8).upper()}"

        order_kwargs = {
            'customer_name': request.data.get('customer_name', 'Khách hàng').strip(),
            'customer_phone': request.data.get('customer_phone', '').strip(),
            'shipping_address': request.data.get('shipping_address', '').strip(),
            'total_amount': request.data.get('total_amount', 0),
            'status': Order.Status.PENDING,
        }
        if hasattr(Order, 'order_code'):
            order_kwargs['order_code'] = order_code
        if hasattr(Order, 'customer_email'):
            order_kwargs['customer_email'] = request.data.get('customer_email', '')
        if hasattr(Order, 'notes'):
            order_kwargs['notes'] = request.data.get('notes', '')

        # Gán tài khoản mua hàng
        if request.user.is_authenticated:
            if hasattr(Order, 'user'):
                order_kwargs['user'] = request.user
            elif hasattr(Order, 'customer'):
                order_kwargs['customer'] = request.user

        order = Order.objects.create(**order_kwargs)

        # Tạo OrderItem và Trừ kho
        for it in items_data:
            p_id = it.get('product_id') or it.get('id')
            qty = int(it.get('quantity', 1))
            multiplier = float(it.get('multiplier_kg', 1.0))
            unit_price = it.get('price')

            product = Product.objects.select_for_update().get(pk=p_id)
            item_price = float(unit_price) if unit_price is not None else float(product.price)

            item_kwargs = {
                'order': order,
                'product': product,
                'price': item_price,
                'quantity': qty,
            }
            if hasattr(OrderItem, 'subtotal'):
                item_kwargs['subtotal'] = item_price * qty
            if hasattr(OrderItem, 'batch'):
                latest_batch = product.batches.order_by('-harvest_date').first()
                if latest_batch:
                    item_kwargs['batch'] = latest_batch

            OrderItem.objects.create(**item_kwargs)

            # Trừ tồn kho theo đúng trọng lượng thực tế
            deduct_amount = int(round(qty * multiplier)) if multiplier > 0 else qty
            product.stock_quantity = max(0, product.stock_quantity - deduct_amount)
            if product.stock_quantity == 0:
                product.is_active = False
            product.save(update_fields=['stock_quantity', 'is_active'])

        # Refresh lại instance để load quan hệ items vào OrderDetailSerializer
        order.refresh_from_db()
        return Response(
            OrderDetailSerializer(order, context={'request': request}).data, 
            status=status.HTTP_201_CREATED
        )

    # 2. Đơn hàng của khách hàng hiện tại
    @action(detail=False, methods=['get'], url_path='my-orders', permission_classes=[permissions.IsAuthenticated])
    def my_orders(self, request):
        user = request.user
        filter_q = Q()
        if hasattr(Order, 'user'):
            filter_q |= Q(user=user)
        if hasattr(Order, 'customer'):
            filter_q |= Q(customer=user)
        
        user_phone = getattr(user, 'phone', '') or getattr(user, 'phone_number', '')
        if user_phone:
            filter_q |= Q(customer_phone=user_phone)

        orders = Order.objects.filter(filter_q).distinct().order_by('-created_at')
        serializer = OrderDetailSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    # 3. Cập nhật trạng thái
    @action(detail=True, methods=['post'], url_path='update-status', permission_classes=[permissions.IsAuthenticated])
    @transaction.atomic
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        old_status = order.status

        # 1. Kiểm tra quyền sở hữu của chủ shop
        is_owner = False
        if hasattr(order, 'farm') and order.farm and order.farm.owner == request.user:
            is_owner = True
        elif order.items.filter(product__farm__owner=request.user).exists():
            is_owner = True

        if not is_owner and not request.user.is_staff:
            return Response(
                {"error": "Bạn không có quyền quản lý đơn hàng của nông trại này."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Shop không được đổi sang CANCELLED
        if new_status == Order.Status.CANCELLED:
            return Response(
                {"error": "Chủ shop không thể hủy đơn hàng này, chỉ khách hàng mới có quyền hủy."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Đơn đã hủy hoặc đã giao thành công thì khóa cứng
        if old_status == Order.Status.CANCELLED:
            return Response(
                {"error": "Đơn hàng đã bị khách hủy, không thể thay đổi trạng thái!"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if old_status == Order.Status.DELIVERED:
            return Response(
                {"error": "Đơn hàng đã giao thành công, không thể thay đổi trạng thái!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Ràng buộc luồng tiến 1 chiều hợp lệ
        valid_transitions = {
            Order.Status.PENDING: [Order.Status.CONFIRMED],
            Order.Status.CONFIRMED: [Order.Status.SHIPPING],
            Order.Status.SHIPPING: [Order.Status.DELIVERED],
        }

        allowed_next = valid_transitions.get(old_status, [])
        if new_status not in allowed_next:
            return Response(
                {"error": f"Không thể chuyển trạng thái từ '{old_status}' sang '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save(update_fields=['status'])
        return Response(OrderDetailSerializer(order, context={'request': request}).data)

    # 4. Đơn hàng của chủ trang trại
    @action(detail=False, methods=['get'], url_path='vendor-orders', permission_classes=[permissions.IsAuthenticated])
    def vendor_orders(self, request):
        orders = Order.objects.filter(items__product__farm__owner=request.user).distinct().order_by('-created_at')
        return Response(OrderDetailSerializer(orders, many=True, context={'request': request}).data)

    # 5. Thống kê nhà vườn
    @action(detail=False, methods=['get'], url_path='stats', permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        user_orders = Order.objects.filter(items__product__farm__owner=request.user).distinct()
        
        real_revenue = user_orders.filter(status=Order.Status.DELIVERED).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        pending_revenue = user_orders.filter(status__in=[Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.SHIPPING]).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        top_products = (
            OrderItem.objects.filter(
                product__farm__owner=request.user, 
                order__status__in=[Order.Status.DELIVERED, Order.Status.CONFIRMED, Order.Status.SHIPPING]
            )
            .values('product_id', product_name=F('product__name'))
            .annotate(
                total_sold=Sum('quantity'),
                total_sales=Sum(F('price') * F('quantity'))
            )
            .order_by('-total_sold')[:5]
        )

        low_stock_count = Product.objects.filter(farm__owner=request.user, stock_quantity__lte=5, is_active=True).count()
        out_of_stock_count = Product.objects.filter(farm__owner=request.user, stock_quantity=0).count()

        return Response({
            "real_revenue": real_revenue,
            "pending_revenue": pending_revenue,
            "total_orders": user_orders.count(),
            "delivered_orders": user_orders.filter(status=Order.Status.DELIVERED).count(),
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "top_products": list(top_products)
        })

    # 6. Khách hàng tự hủy đơn hàng khi đang ở trạng thái PENDING
    @action(detail=True, methods=['post'], url_path='cancel-order', permission_classes=[permissions.AllowAny])
    @transaction.atomic
    def cancel_order(self, request, pk=None):
        order = self.get_object()

        if request.user.is_authenticated:
            is_order_user = False
            if hasattr(order, 'user') and order.user == request.user:
                is_order_user = True
            elif hasattr(order, 'customer') and order.customer == request.user:
                is_order_user = True

            if not is_order_user and not request.user.is_staff:
                return Response(
                    {"error": "Bạn không có quyền hủy đơn hàng của tài khoản khác."},
                    status=status.HTTP_403_FORBIDDEN
                )

        if order.status != Order.Status.PENDING:
            return Response(
                {"error": "Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Hoàn lại tồn kho cho từng sản phẩm trong đơn
        for item in order.items.select_related('product').all():
            if item.product:
                p = Product.objects.select_for_update().get(pk=item.product.id)
                qty = item.quantity
                
                multiplier = getattr(item, 'multiplier_kg', 1.0)
                try:
                    mult_val = float(multiplier) if multiplier else 1.0
                except (ValueError, TypeError):
                    mult_val = 1.0
                    
                return_qty = int(round(qty * mult_val)) if mult_val > 0 else qty
                
                p.stock_quantity += return_qty
                if not p.is_active and p.stock_quantity > 0:
                    p.is_active = True
                p.save(update_fields=['stock_quantity', 'is_active'])

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])

        return Response(OrderDetailSerializer(order, context={'request': request}).data, status=status.HTTP_200_OK)