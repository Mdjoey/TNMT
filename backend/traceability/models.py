from django.db import models
from farms.models import Product

class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_code = models.CharField(max_length=50, unique=True, verbose_name="Mã Lô hàng")
    harvest_date = models.DateField(verbose_name="Ngày thu hoạch")
    quantity = models.IntegerField(verbose_name="Sản lượng thu hoạch")
    qr_code_url = models.CharField(max_length=500, blank=True, null=True)
    eco_score = models.IntegerField(default=100, verbose_name="Điểm Eco-Score")
    eco_grade = models.CharField(max_length=5, default="A+", verbose_name="Xếp hạng AI")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.batch_code

class EnvData(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='env_records')
    temperature = models.FloatField(verbose_name="Nhiệt độ (C)")
    humidity = models.FloatField(verbose_name="Độ ẩm air (%)")
    soil_moisture = models.FloatField(verbose_name="Độ ẩm đất (%)")
    soil_ph = models.FloatField(verbose_name="Độ pH đất")
    pm25 = models.FloatField(verbose_name="Bụi mịn PM2.5")
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dữ liệu {self.batch.batch_code} lúc {self.recorded_at}"