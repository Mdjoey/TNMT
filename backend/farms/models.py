from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils.crypto import get_random_string

class Farm(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='farms', 
        verbose_name="Chủ trang trại",
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255, verbose_name="Tên trang trại")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, verbose_name="Mô tả phương pháp canh tác")
    address = models.TextField(verbose_name="Địa chỉ")
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, verbose_name="Vĩ độ GPS")
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True, verbose_name="Kinh độ GPS")
    vietgap_cert_id = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã chứng nhận VietGAP")
    image_url = models.TextField(blank=True, null=True, verbose_name="Ảnh bìa trang trại")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name, allow_unicode=True) or "farm"
            unique_slug = base_slug
            while Farm.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{get_random_string(4).lower()}"
            self.slug = unique_slug
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
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    category = models.CharField(max_length=100, verbose_name="Danh mục (Rau, Trái cây...)")
    description = models.TextField(blank=True, verbose_name="Mô tả sản phẩm")
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Giá bán (VNĐ)")
    stock_quantity = models.PositiveIntegerField(default=50, verbose_name="Số lượng tồn kho")
    unit = models.CharField(max_length=20, default="kg", verbose_name="Đơn vị tính")
    image_url = models.TextField(blank=True, null=True, verbose_name="Đường dẫn ảnh")
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name="File ảnh tải lên")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.APPROVED)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name, allow_unicode=True) or "product"
            unique_slug = base_slug
            while Product.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{get_random_string(4).lower()}"
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.farm.name}"

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100, verbose_name="Tên phân loại (VD: Gói 500g, Túi 1kg, Thùng 5kg)")
    multiplier_kg = models.FloatField(default=1.0, verbose_name="Trọng lượng quy đổi (kg)")
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Giá bán cho phân loại này")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.name} - {self.name} ({self.price} đ)"


# Trong backend/farms/models.py
class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_reviews')
    customer_name = models.CharField(max_length=100)
    rating = models.PositiveSmallIntegerField(default=5, verbose_name="Số sao (1 - 5)")
    comment = models.TextField(verbose_name="Nội dung đánh giá")
    shop_reply = models.TextField(blank=True, null=True, verbose_name="Phản hồi của chủ shop")
    replied_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        # Đảm bảo 1 tài khoản chỉ được đánh giá 1 lần duy nhất cho mỗi sản phẩm
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.product.name} - {self.rating}* ({self.customer_name})"

class BlogPost(models.Model):
    class Category(models.TextChoices):
        FARM_STORY = 'FARM_STORY', 'Nhật ký nông hộ'
        VIETGAP_TECH = 'VIETGAP_TECH', 'Quy trình & Công nghệ'
        EAT_CLEAN = 'EAT_CLEAN', 'Món ngon & Eat-Clean'
        KNOWLEDGE = 'KNOWLEDGE', 'Kiến thức nông sản'

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='posts', verbose_name="Nhà vườn đăng bài")
    title = models.CharField(max_length=255, verbose_name="Tiêu đề bài viết")
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.KNOWLEDGE, verbose_name="Chủ đề")
    cover_image = models.ImageField(upload_to='blog_covers/', null=True, blank=True, verbose_name="Ảnh bìa bài viết")
    cover_image_url = models.URLField(max_length=500, blank=True, default='', verbose_name="Hoặc Link ảnh bìa ngoài")
    excerpt = models.TextField(max_length=500, verbose_name="Tóm tắt ngắn (1-2 câu)")
    content = models.TextField(verbose_name="Nội dung bài viết")
    related_products = models.ManyToManyField(Product, blank=True, related_name='blog_posts', verbose_name="Nông sản nhắc tới trong bài")
    views_count = models.PositiveIntegerField(default=0, verbose_name="Lượt đọc")
    is_published = models.BooleanField(default=True, verbose_name="Công khai")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày đăng")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Bài viết Blog"
        verbose_name_plural = "Quản lý Blog"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or "bai-viet"
            self.slug = f"{base_slug}-{get_random_string(5).lower()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title