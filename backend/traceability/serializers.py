from rest_framework import serializers
from .models import Batch, EnvData

class EnvDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvData
        fields = ['id', 'temperature', 'humidity', 'soil_moisture', 'soil_ph', 'pm25', 'recorded_at']

class BatchSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    farm_name = serializers.ReadOnlyField(source='product.farm.name')
    env_records = EnvDataSerializer(many=True, read_only=True)

    class Meta:
        model = Batch
        fields = ['id', 'batch_code', 'product_name', 'farm_name', 'harvest_date', 'quantity', 'eco_score', 'eco_grade', 'env_records']