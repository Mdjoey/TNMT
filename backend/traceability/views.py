from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Batch
from .serializers import BatchSerializer

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'batch_code' # Cho phép truy vấn thẳng theo Mã lô hàng trên URL (VD: /api/batches/BATCH-1234/)
