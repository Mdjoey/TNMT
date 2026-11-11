from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmViewSet, ProductViewSet, BlogPostViewSet

router = DefaultRouter()
router.register(r'farms', FarmViewSet, basename='farm')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'posts', BlogPostViewSet, basename='blog-posts')

urlpatterns = [
    path('', include(router.urls)),
]