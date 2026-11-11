from rest_framework import serializers
from .models import Farm, Product, ProductVariant, ProductReview, BlogPost


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'multiplier_kg', 'price', 'is_active']


class ProductReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ProductReview
        fields = [
            'id', 'username', 'customer_name', 
            'rating', 'comment', 'shop_reply', 
            'replied_at', 'created_at'
        ]


class ProductSerializer(serializers.ModelSerializer):
    farm_name = serializers.ReadOnlyField(source='farm.name')
    farm_id = serializers.ReadOnlyField(source='farm.id')
    farm_slug = serializers.ReadOnlyField(source='farm.slug')
    latest_batch = serializers.SerializerMethodField()
    display_image = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    user_has_reviewed = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'farm', 'farm_id', 'farm_name', 'farm_slug', 'name', 
            'slug', 'category', 'description', 'price', 'unit', 
            'stock_quantity', 'image_url', 'image', 'display_image', 
            'status', 'is_active', 'created_at', 'latest_batch',
            'variants', 'reviews', 'avg_rating', 'review_count', 
            'user_has_reviewed', 'is_owner'
        ]

    def get_display_image(self, obj):
        if obj.image:
            return obj.image.url
        return obj.image_url or "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"

    def get_latest_batch(self, obj):
        batch = obj.batches.order_by('-harvest_date').first()
        if batch:
            return {
                'batch_code': batch.batch_code,
                'eco_score': batch.eco_score,
                'eco_grade': batch.eco_grade,
                'harvest_date': batch.harvest_date
            }
        return None

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return 5.0
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_user_has_reviewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reviews.filter(user=request.user).exists()
        return False

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.farm.owner_id == request.user.id
        return False


class FarmSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.username')
    products_count = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = [
            'id', 'owner', 'owner_name', 'name', 'slug', 'description',
            'address', 'latitude', 'longitude', 'vietgap_cert_id',
            'image_url', 'cover_image', 'created_at', 'products_count'
        ]

    def get_products_count(self, obj):
        # Tránh crash nếu status không phải APPROVED hoặc chưa có sản phẩm
        try:
            return obj.products.filter(is_active=True).count()
        except Exception:
            return 0

    def get_cover_image(self, obj):
        cover = getattr(obj, 'cover_image', None) or getattr(obj, 'banner', None)
        if cover:
            return cover.url if hasattr(cover, 'url') else str(cover)
        return getattr(obj, 'image_url', None)


class FarmDetailSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    owner_name = serializers.ReadOnlyField(source='owner.username')
    is_owner = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = [
            'id', 'owner', 'owner_name', 'name', 'slug', 'description', 
            'address', 'latitude', 'longitude', 'vietgap_cert_id', 
            'image_url', 'cover_image', 'created_at', 'products', 'is_owner'
        ]

    def get_cover_image(self, obj):
        # Trả về URL tương đối nếu dùng File/ImageField hoặc trường URL tùy chọn
        cover = getattr(obj, 'cover_image', None) or getattr(obj, 'banner', None)
        if cover:
            return cover.url if hasattr(cover, 'url') else str(cover)
        return getattr(obj, 'image_url', None)

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner_id == request.user.id
        return False


class BlogPostSerializer(serializers.ModelSerializer):
    farm_id = serializers.ReadOnlyField(source='farm.id')
    farm_slug = serializers.ReadOnlyField(source='farm.slug')
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    display_image = serializers.SerializerMethodField()
    related_products_detail = ProductSerializer(source='related_products', many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            'id', 'farm', 'farm_id', 'farm_slug', 'farm_name', 'title', 'slug', 'category', 'category_display',
            'cover_image', 'cover_image_url', 'display_image', 'excerpt', 'content',
            'related_products', 'related_products_detail', 'views_count', 'is_published', 'created_at'
        ]
        read_only_fields = ['farm', 'slug', 'views_count', 'created_at']
        extra_kwargs = {
            'cover_image': {'required': False, 'allow_null': True},
            'cover_image_url': {'required': False, 'allow_blank': True},
            'related_products': {'required': False},
            'is_published': {'required': False},
        }

    def get_display_image(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return obj.cover_image_url or "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"