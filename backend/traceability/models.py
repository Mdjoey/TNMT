from django.db import models
from farms.models import Product
import qrcode
from io import BytesIO
from django.core.files import File

class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches', verbose_name="Sản phẩm")
    batch_code = models.CharField(max_length=50, unique=True, verbose_name="Mã Lô hàng")
    planting_date = models.DateField(null=True, blank=True, verbose_name="Ngày xuống giống") # Bổ sung để khớp đề cương
    harvest_date = models.DateField(verbose_name="Ngày thu hoạch")
    quantity = models.IntegerField(verbose_name="Sản lượng thu hoạch")
    qr_code_image = models.ImageField(upload_to='qr_codes/', blank=True, null=True, verbose_name="Ảnh mã QR")
    eco_score = models.FloatField(default=100.0, verbose_name="Điểm Eco-Score") # Đổi sang FloatField
    eco_grade = models.CharField(max_length=5, default="A", verbose_name="Xếp hạng sinh thái")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.batch_code} - {self.product.name}"

    def save(self, *args, **kwargs):
        # Tự động sinh mã QR nếu chưa có ảnh
        if not self.qr_code_image:
            qr_url = f"http://localhost:5173/trace/{self.batch_code}"
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=8,
                border=2,
            )
            qr.add_data(qr_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            self.qr_code_image.save(f"qr_{self.batch_code}.png", File(buffer), save=False)

        super().save(*args, **kwargs)

class EnvData(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='env_records', verbose_name="Lô hàng")
    temperature = models.FloatField(verbose_name="Nhiệt độ (°C)")
    humidity = models.FloatField(verbose_name="Độ ẩm không khí (%)")
    soil_moisture = models.FloatField(verbose_name="Độ ẩm đất (%)")
    soil_ph = models.FloatField(verbose_name="Độ pH đất")
    pm25 = models.FloatField(null=True, blank=True, verbose_name="Bụi mịn PM2.5")
    recorded_at = models.DateTimeField(verbose_name="Thời điểm ghi nhận") # Dùng DateTime thực tế thay vì auto_now_add để nhập dữ liệu theo chuỗi ngày

    class Meta:
        ordering = ['recorded_at']

    def __str__(self):
        return f"{self.batch.batch_code} - {self.recorded_at.strftime('%d/%m/%Y')}"