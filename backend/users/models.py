from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Quản trị viên'
        FARMER = 'FARMER', 'Chủ trang trại'
        CUSTOMER = 'CUSTOMER', 'Khách hàng'

    email = models.EmailField(unique=True, verbose_name="Email")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Số điện thoại")
    role = models.CharField(
        max_length=15, 
        choices=Role.choices, 
        default=Role.CUSTOMER,
        verbose_name="Vai trò"
    )
    otp_code = models.CharField(max_length=6, blank=True, null=True, verbose_name="Mã OTP")
    is_verified = models.BooleanField(default=False, verbose_name="Đã xác thực OTP")

    USERNAME_FIELD = 'email'  # Dùng Email để đăng nhập thay cho username
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"