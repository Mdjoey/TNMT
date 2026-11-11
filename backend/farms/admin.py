from django.contrib import admin
from .models import Farm, Product

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'address')
    search_fields = ('name', 'address')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'unit', 'status', 'is_active', 'farm')
    list_filter = ('category', 'status', 'is_active')
    search_fields = ('name',)