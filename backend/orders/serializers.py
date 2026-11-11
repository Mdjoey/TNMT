from rest_framework import serializers
from .models import Order, OrderItem
from farms.models import Product


# 1. Serializer chi tiết từng sản phẩm trong đơn hàng
class OrderItemDetailSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True, default='')
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    batch_code = serializers.ReadOnlyField(source='batch.batch_code')
    farm_id = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product_slug', 'product_name', 
            'product_image', 'batch_code', 'quantity', 'price', 
            'farm_id', 'farm_name'
        ]

    def get_product_name(self, obj):
        if obj.product:
            return obj.product.name
        return getattr(obj, 'product_name', 'Nông sản')

    def get_product_image(self, obj):
        if not obj.product:
            return None
        
        p = obj.product
        raw_url = None

        if hasattr(p, 'image') and p.image:
            try:
                raw_url = p.image.url
            except Exception:
                raw_url = str(p.image)
        elif hasattr(p, 'display_image'):
            val = getattr(p, 'display_image')
            raw_url = val() if callable(val) else val
        elif hasattr(p, 'image_url'):
            raw_url = getattr(p, 'image_url')

        if not raw_url:
            return None

        # Làm sạch chuỗi, gạt bỏ dấu *, ), khoảng trắng bị dính vào dữ liệu
        clean_url = str(raw_url).strip().rstrip('*)"\'')

        if clean_url.startswith('http://') or clean_url.startswith('https://'):
            return clean_url

        if not clean_url.startswith('/'):
            clean_url = '/' + clean_url

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(clean_url)

        return f"http://localhost:8000{clean_url}"

    def get_farm_id(self, obj):
        if obj.product and hasattr(obj.product, 'farm') and obj.product.farm:
            return obj.product.farm.id
        return None

    def get_farm_name(self, obj):
        if obj.product and hasattr(obj.product, 'farm') and obj.product.farm:
            return obj.product.farm.name
        return "Nông Trại Shop"


# 2. Serializer hiển thị khi tra cứu đơn hàng
class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    order_code = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    farm_id = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_code', 'customer_name', 'customer_phone', 
            'shipping_address', 'total_amount', 'payment_method', 
            'status', 'status_display', 'created_at', 'items',
            'farm_id', 'farm_name'
        ]

    def get_order_code(self, obj):
        if hasattr(obj, 'order_code') and obj.order_code:
            return obj.order_code
        from django.utils.crypto import get_random_string
        new_code = f"ORD-{get_random_string(8).upper()}"
        if hasattr(obj, 'order_code'):
            obj.order_code = new_code
            obj.save(update_fields=['order_code'])
        return new_code

    def get_farm_id(self, obj):
        first_item = obj.items.select_related('product__farm').first()
        if first_item and first_item.product and hasattr(first_item.product, 'farm') and first_item.product.farm:
            return first_item.product.farm.id
        return None

    def get_farm_name(self, obj):
        first_item = obj.items.select_related('product__farm').first()
        if first_item and first_item.product and hasattr(first_item.product, 'farm') and first_item.product.farm:
            return first_item.product.farm.name
        return "Nông Trại Shop"


# 3. Serializer tạo đơn hàng mới
class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(write_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_phone', 
            'shipping_address', 'total_amount', 'status', 
            'created_at', 'items'
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        order_kwargs = {**validated_data}
        if user:
            if hasattr(Order, 'user'):
                order_kwargs['user'] = user
            elif hasattr(Order, 'customer'):
                order_kwargs['customer'] = user

        from django.utils.crypto import get_random_string
        if hasattr(Order, 'order_code'):
            order_kwargs['order_code'] = f"ORD-{get_random_string(8).upper()}"

        order = Order.objects.create(**order_kwargs)

        for item in items_data:
            p_id = item.get('product_id') or item.get('id')
            product = Product.objects.get(id=p_id)
            latest_batch = product.batches.order_by('-harvest_date').first() if hasattr(product, 'batches') else None

            item_price = float(item.get('price', product.price))
            qty = int(item.get('quantity', 1))

            item_kwargs = {
                'order': order,
                'product': product,
                'quantity': qty,
                'price': item_price,
            }
            if hasattr(OrderItem, 'batch') and latest_batch:
                item_kwargs['batch'] = latest_batch

            OrderItem.objects.create(**item_kwargs)

        return order