from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from farms.views import ProductViewSet, FarmViewSet, BlogPostViewSet  # 1. Thêm BlogPostViewSet
from traceability.views import BatchViewSet
from orders.views import OrderViewSet

router = DefaultRouter()
router.register(r'farms', FarmViewSet, basename='farm')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'posts', BlogPostViewSet, basename='blog-posts')    # 2. Đăng ký posts vào router

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),                              # Giờ đây /api/posts/ đã chính thức hoạt động
    path('api/users/', include('users.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)