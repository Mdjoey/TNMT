from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Farm(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='farms', verbose_name="Chủ trang trại")
    name = models.CharField(max_length=255, verbose_name="Tên trang trại")
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True, verbose_name="Mô tả phương pháp canh tác")
    address = models.TextField(verbose_name="Địa chỉ")
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, verbose_name="Vĩ độ GPS")
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True, verbose_name="Kinh độ GPS")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Product(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ duyệt'
        APPROVED = 'APPROVED', 'Đã duyệt'
        REJECTED = 'REJECTED', 'Từ chối'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='products', verbose_name="Trang trại")
    name = models.CharField(max_length=255, verbose_name="Tên sản phẩm")
    slug = models.SlugField(unique=True, blank=True)
    category = models.CharField(max_length=100, verbose_name="Danh mục (Rau, Trái cây...)")
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Giá bán (VNĐ)")
    unit = models.CharField(max_length=20, default="kg", verbose_name="Đơn vị tính")
    image_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.farm.name}"