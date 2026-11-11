import csv
import io
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime

from .models import Batch, EnvData
from .serializers import BatchTraceSerializer
from .services import calculate_eco_score


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().select_related('product', 'product__farm').prefetch_related('env_records')
    serializer_class = BatchTraceSerializer
    lookup_field = 'batch_code'
    permission_classes = [permissions.AllowAny]
    # Bổ sung JSONParser để nhận dữ liệu JSON từ axios.put/patch
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # 1. Cập nhật thông tin Lô hàng (Sản lượng, Ngày gieo, Ngày thu hoạch)
    # 1. Cập nhật thông tin Lô hàng & Chỉ số vi khí hậu ban đầu
    def update(self, request, *args, **kwargs):
        kwargs.pop('partial', True)
        instance = self.get_object()

        # Cập nhật số lượng, ngày gieo, ngày thu hoạch
        if 'quantity' in request.data:
            digits_only = ''.join(c for c in str(request.data.get('quantity')) if c.isdigit())
            instance.quantity = int(digits_only) if digits_only else instance.quantity
        if 'planting_date' in request.data:
            instance.planting_date = request.data.get('planting_date')
        if 'harvest_date' in request.data:
            instance.harvest_date = request.data.get('harvest_date')

        # Cập nhật bản ghi vi khí hậu ban đầu nếu có truyền lên
        has_env_update = any(k in request.data for k in ['init_temp', 'init_hum', 'init_soil_m', 'init_ph', 'temperature', 'humidity', 'soil_moisture', 'soil_ph'])
        if has_env_update:
            t = request.data.get('init_temp') or request.data.get('temperature')
            h = request.data.get('init_hum') or request.data.get('humidity')
            sm = request.data.get('init_soil_m') or request.data.get('soil_moisture')
            ph = request.data.get('init_ph') or request.data.get('soil_ph')

            # Lấy bản ghi vi khí hậu đầu tiên của lô để cập nhật (hoặc tạo mới nếu chưa có)
            first_env = instance.env_records.order_by('recorded_at').first()
            if not first_env:
                first_env = EnvData(batch=instance)

            if t is not None: first_env.temperature = float(t)
            if h is not None: first_env.humidity = float(h)
            if sm is not None: first_env.soil_moisture = float(sm)
            if ph is not None: first_env.soil_ph = float(ph)
            first_env.save()

            # Tự động tính toán lại điểm Eco-Score và phân hạng VietGAP
            score, grade = calculate_eco_score(instance)
            instance.eco_score = score
            instance.eco_grade = grade

        instance.save()
        return Response(BatchTraceSerializer(instance).data)

    # 2. Xóa Lô hàng
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        code = instance.batch_code
        instance.delete()
        return Response({"message": f"Đã xóa thành công lô {code}"}, status=status.HTTP_200_OK)

    # 3. Nạp file nhật ký vi khí hậu (Hỗ trợ CSV/Excel xuất CSV)
    @action(detail=True, methods=['post'], url_path='import-excel', permission_classes=[permissions.IsAuthenticated])
    def import_excel(self, request, batch_code=None):
        batch = get_object_or_404(Batch, batch_code=batch_code)
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "Vui lòng tải lên file dữ liệu CSV (.csv)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_data = file_obj.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(file_data))

            created_count = 0
            for row in reader:
                row_normalized = {k.strip().lower().replace(' ', '_'): v for k, v in row.items() if k}

                temp = float(row_normalized.get('temperature') or row_normalized.get('nhiet_do') or 25.0)
                hum = float(row_normalized.get('humidity') or row_normalized.get('do_am_kk') or 75.0)
                sm = float(row_normalized.get('soil_moisture') or row_normalized.get('do_am_dat') or 70.0)
                ph = float(row_normalized.get('soil_ph') or row_normalized.get('ph_dat') or 6.5)

                rec_date = timezone.now()
                date_str = row_normalized.get('date')
                if date_str:
                    try:
                        rec_date = datetime.strptime(date_str.strip(), '%Y-%m-%d')
                    except Exception:
                        pass

                EnvData.objects.create(
                    batch=batch,
                    temperature=temp,
                    humidity=hum,
                    soil_moisture=sm,
                    soil_ph=ph,
                    recorded_at=rec_date
                )
                created_count += 1

            # Tự động tính toán lại điểm Eco-Score chuẩn VietGAP
            score, grade = calculate_eco_score(batch)
            batch.eco_score = score
            batch.eco_grade = grade
            batch.save(update_fields=['eco_score', 'eco_grade'])

            return Response({
                "message": f"Đã nạp thành công {created_count} bản ghi vi khí hậu từ file!",
                "new_eco_score": score,
                "new_eco_grade": grade,
                "batch": BatchTraceSerializer(batch).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Lỗi đọc file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)