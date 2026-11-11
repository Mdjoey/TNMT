from django.urls import path
from .views import BatchTraceDetailView, BatchRecalculateEcoScoreView

urlpatterns = [
    path('batch/<str:batch_code>/', BatchTraceDetailView.as_view(), name='batch-trace-detail'),
    path('batch/<str:batch_code>/recalculate/', BatchRecalculateEcoScoreView.as_view(), name='batch-recalculate-eco'),
]