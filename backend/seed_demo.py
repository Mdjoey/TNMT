import os
import django
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from farms.models import Farm, Product
from traceability.models import Batch, EnvData
from traceability.services import calculate_eco_score, generate_qr_code

def run():
    print("Bắt đầu khởi tạo dữ liệu mẫu...")

    # 1. Tạo Farmer User
    farmer, _ = User.objects.get_or_create(
        email="nongtraixanh@gmail.com",
        defaults={'username': 'nongtraixanh', 'role': User.Role.FARMER, 'is_verified': True}
    )

    # 2. Tạo Trang trại
    farm, _ = Farm.objects.get_or_create(
        name="Hợp tác xã Nông nghiệp Sạch Củ Chi",
        defaults={
            'owner': farmer,
            'address': "Ấp Phú Mỹ, Xã Phú Hòa Đông, Huyện Củ Chi, TP. Hồ Chí Minh",
            'latitude': 11.0345,
            'longitude': 106.5234,
            'description': "Quy trình trồng rau thủy canh và hữu cơ theo chuẩn VietGAP."
        }
    )

    # 3. Tạo Sản phẩm
    product, _ = Product.objects.get_or_create(
        name="Cải Bó Xôi Hữu Cơ VietGAP",
        defaults={
            'farm': farm,
            'category': "Rau ăn lá",
            'price': 45000,
            'unit': "túi 500g",
            'status': Product.Status.APPROVED,
            'is_active': True,
            'image_url': "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600"
        }
    )

    # 4. Tạo Lô sản xuất (Batch)
    batch_code = "LOT-2026-CBX-01"
    batch, created = Batch.objects.get_or_create(
        batch_code=batch_code,
        defaults={
            'product': product,
            'planting_date': date(2026, 9, 1),
            'harvest_date': date(2026, 10, 5),
            'quantity': 350
        }
    )

    # 5. Sinh chuỗi dữ liệu môi trường trong 10 ngày gần nhất
    if created or not batch.env_records.exists():
        start_time = timezone.now() - timedelta(days=10)
        # Giả lập dữ liệu có dao động nhẹ theo chuẩn VietGAP
        for day in range(10):
            recorded_time = start_time + timedelta(days=day)
            EnvData.objects.create(
                batch=batch,
                temperature=26.5 + (day % 3) * 1.2,
                humidity=72.0 + (day % 4) * 2.0,
                soil_moisture=75.0 - (day % 2) * 3.0,
                soil_ph=6.2 + (day % 2) * 0.2,
                pm25=18.5,
                recorded_at=recorded_time
            )

        # Tính điểm Eco-Score và sinh mã QR
        score, grade = calculate_eco_score(batch)
        batch.eco_score = score
        batch.eco_grade = grade
        generate_qr_code(batch)
        batch.save()

    print(f"Hoàn thành! Mã lô: {batch.batch_code} | Điểm Eco-Score: {batch.eco_score} ({batch.eco_grade})")

if __name__ == '__main__':
    run()