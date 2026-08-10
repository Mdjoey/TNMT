import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from farms.models import Farm, Product
from traceability.models import Batch, EnvData

class Command(BaseCommand):
    help = "Tự động nạp dữ liệu mẫu vào PostgreSQL"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Đang xóa dữ liệu cũ và tiến hành bơm data mẫu..."))

        # 1. Tạo tài khoản Admin
        admin, _ = User.objects.get_or_create(
            email="admin@agritrace.com",
            defaults={
                "username": "admin",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
            }
        )
        admin.set_password("Admin@123")
        admin.save()
        self.stdout.write(self.style.SUCCESS("-> Đã tạo Admin: admin@agritrace.com / Admin@123"))

        # 2. Danh sách Chủ trang trại & Nông trại mẫu
        farms_data = [
            {
                "email": "dalat_farmer@gmail.com",
                "name": "Nông trại Dâu Tây Đà Lạt Eco",
                "address": "Phường 11, TP. Đà Lạt, Lâm Đồng",
                "lat": 11.940419, "lng": 108.458313,
                "products": [
                    {"name": "Dâu Tây Giống Nhật", "category": "Trái cây", "price": 180000, "unit": "hộp 500g"},
                    {"name": "Cà Chua Cherry Organic", "category": "Rau củ", "price": 45000, "unit": "kg"},
                ]
            },
            {
                "email": "mocchau_farmer@gmail.com",
                "name": "Trang trại Rau Hữu Cơ Mộc Châu",
                "address": "Thị trấn Mộc Châu, Sơn La",
                "lat": 20.843652, "lng": 104.682159,
                "products": [
                    {"name": "Xà Lách Thủy Canh", "category": "Rau xanh", "price": 35000, "unit": "kg"},
                    {"name": "Cải Kale Organic", "category": "Rau xanh", "price": 60000, "unit": "kg"},
                ]
            }
        ]

        for farm_info in farms_data:
            # Tạo Farmer
            farmer, _ = User.objects.get_or_create(
                email=farm_info["email"],
                defaults={
                    "username": farm_info["email"].split('@')[0],
                    "role": User.Role.FARMER,
                    "is_verified": True
                }
            )
            farmer.set_password("Farmer@123")
            farmer.save()

            # Tạo Farm
            farm, _ = Farm.objects.get_or_create(
                owner=farmer,
                name=farm_info["name"],
                defaults={
                    "address": farm_info["address"],
                    "latitude": farm_info["lat"],
                    "longitude": farm_info["lng"],
                    "description": "Nông trại đạt chuẩn VietGAP & GlobalGAP, áp dụng công nghệ giám sát IoT."
                }
            )

            # Tạo Products
            for p_info in farm_info["products"]:
                product, _ = Product.objects.get_or_create(
                    farm=farm,
                    name=p_info["name"],
                    defaults={
                        "category": p_info["category"],
                        "price": p_info["price"],
                        "unit": p_info["unit"],
                        "status": Product.Status.APPROVED,
                        "is_active": True
                    }
                )

                # Tạo Lô hàng mẫu (Batch)
                batch_code = f"BATCH-{random.randint(1000, 9999)}"
                batch = Batch.objects.create(
                    product=product,
                    batch_code=batch_code,
                    harvest_date=timezone.now().date(),
                    quantity=random.randint(100, 500),
                    eco_score=95,
                    eco_grade="A+"
                )

                # Sinh 20 dòng Dữ liệu IoT cảm biến ngẫu nhiên trong 7 ngày qua
                now = timezone.now()
                for i in range(20):
                    time_offset = now - timedelta(hours=i * 6)
                    EnvData.objects.create(
                        batch=batch,
                        temperature=round(random.uniform(18.0, 26.0), 1),
                        humidity=round(random.uniform(65.0, 85.0), 1),
                        soil_moisture=round(random.uniform(60.0, 80.0), 1),
                        soil_ph=round(random.uniform(6.0, 6.8), 2),
                        pm25=round(random.uniform(10.0, 35.0), 1),
                        recorded_at=time_offset
                    )

        # 3. Tạo 1 Khách hàng mẫu
        customer, _ = User.objects.get_or_create(
            email="customer@gmail.com",
            defaults={
                "username": "customer",
                "role": User.Role.CUSTOMER,
                "is_verified": True
            }
        )
        customer.set_password("Customer@123")
        customer.save()

        self.stdout.write(self.style.SUCCESS("-> Bơm dữ liệu mẫu thành công 100%!"))