from rest_framework import serializers
from .models import Farm, Product

class ProductSerializer(serializers.ModelSerializer):
    farm_name = serializers.ReadOnlyField(source='farm.name')

    class Meta:
        model = Product
        fields = ['id', 'farm', 'farm_name', 'name', 'slug', 'category', 'price', 'unit', 'image_url', 'status', 'is_active']

class FarmSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    products = ProductSerializer(many=True, read_only=True)

    class Meta:
        model = Farm
        fields = ['id', 'owner', 'owner_email', 'name', 'slug', 'description', 'address', 'latitude', 'longitude', 'products']