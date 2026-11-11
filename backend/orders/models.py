from django.db import models
from django.conf import settings
from farms.models import Product
from traceability.models import Batch

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ xác nhận'
        CONFIRMED = 'CONFIRMED', 'Đã xác nhận'
        SHIPPING = 'SHIPPING', 'Đang giao hàng'
        DELIVERED = 'DELIVERED', 'Giao thành công'
        CANCELLED = 'CANCELLED', 'Đã hủy'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='orders',
        verbose_name="Tài khoản mua"
    )
    customer_name = models.CharField(max_length=255, verbose_name="Tên người nhận")
    customer_phone = models.CharField(max_length=20, verbose_name="Số điện thoại")
    shipping_address = models.TextField(verbose_name="Địa chỉ giao hàng")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name="Tổng tiền (VNĐ)")
    payment_method = models.CharField(max_length=20, default="COD", verbose_name="Phương thức thanh toán")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING, verbose_name="Trạng thái đơn")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    order_code = models.CharField(max_length=50, unique=True, null=True, blank=True)

    def __str__(self):
        return f"Đơn hàng #{self.id} - {self.customer_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Nông sản")
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Lô xuất kho")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Số lượng")
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Đơn giá tại thời điểm mua")

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"