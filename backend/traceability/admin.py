from django.contrib import admin
from .models import Batch, EnvData

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('batch_code', 'product', 'planting_date', 'harvest_date', 'eco_score', 'eco_grade')
    list_filter = ('eco_grade',)
    search_fields = ('batch_code', 'product__name')

@admin.register(EnvData)
class EnvDataAdmin(admin.ModelAdmin):
    list_display = ('batch', 'temperature', 'humidity', 'soil_moisture', 'soil_ph', 'recorded_at')
    list_filter = ('batch',)