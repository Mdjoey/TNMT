from rest_framework import serializers
from .models import Batch, EnvData
from farms.models import Product, Farm

class EnvDataSerializer(serializers.ModelSerializer):
    # Định dạng thời gian theo ngày/tháng để đưa thẳng vào trục X của biểu đồ Recharts
    recorded_date = serializers.SerializerMethodField()

    class Meta:
        model = EnvData
        fields = [
            'id', 'temperature', 'humidity', 
            'soil_moisture', 'soil_ph', 'pm25', 
            'recorded_at', 'recorded_date'
        ]

    def get_recorded_date(self, obj):
        return obj.recorded_at.strftime('%d/%m') if obj.recorded_at else ''


class FarmDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'description']


class ProductSimpleSerializer(serializers.ModelSerializer):
    farm = FarmDetailSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'price', 'unit', 'image_url', 'farm']

class BatchTraceSerializer(serializers.ModelSerializer):
    product = ProductSimpleSerializer(read_only=True)
    env_records = EnvDataSerializer(many=True, read_only=True)
    qr_code_image = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = [
            'id', 'batch_code', 'planting_date', 'harvest_date', 
            'quantity', 'eco_score', 'eco_grade', 'qr_code_image', 
            'product', 'env_records'
        ]

    def get_qr_code_image(self, obj):
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
            return f"http://localhost:8000{obj.qr_code_image.url}"
        return None