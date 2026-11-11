import io
import qrcode
from django.core.files.base import ContentFile

# Định nghĩa dải ngưỡng chuẩn theo VietGAP (có thể tùy biến theo loại cây)
VIETGAP_STANDARDS = {
    'temperature': {'min': 18.0, 'max': 32.0, 'weight': 0.25, 'penalty': 1.5},
    'humidity': {'min': 60.0, 'max': 85.0, 'weight': 0.20, 'penalty': 1.0},
    'soil_moisture': {'min': 65.0, 'max': 85.0, 'weight': 0.30, 'penalty': 2.0},
    'soil_ph': {'min': 5.5, 'max': 7.0, 'weight': 0.25, 'penalty': 3.0},
}

def calculate_eco_score(batch):
    """
    Thuật toán tính điểm Eco-Score:
    Bắt đầu từ 100 điểm, duyệt qua toàn bộ chuỗi dữ liệu EnvData của lô hàng.
    Mỗi bản ghi vượt ngưỡng cho phép sẽ bị trừ điểm dung sai có trọng số.
    """
    records = batch.env_records.all()
    if not records.exists():
        return 100.0, 'A'

    total_penalty = 0.0
    record_count = records.count()

    for r in records:
        record_penalty = 0.0
        
        # Kiểm tra nhiệt độ
        temp_std = VIETGAP_STANDARDS['temperature']
        if r.temperature < temp_std['min']:
            record_penalty += (temp_std['min'] - r.temperature) * temp_std['penalty'] * temp_std['weight']
        elif r.temperature > temp_std['max']:
            record_penalty += (r.temperature - temp_std['max']) * temp_std['penalty'] * temp_std['weight']

        # Kiểm tra độ ẩm đất
        sm_std = VIETGAP_STANDARDS['soil_moisture']
        if r.soil_moisture < sm_std['min']:
            record_penalty += (sm_std['min'] - r.soil_moisture) * sm_std['penalty'] * sm_std['weight']
        elif r.soil_moisture > sm_std['max']:
            record_penalty += (r.soil_moisture - sm_std['max']) * sm_std['penalty'] * sm_std['weight']

        # Kiểm tra pH đất
        ph_std = VIETGAP_STANDARDS['soil_ph']
        if r.soil_ph < ph_std['min']:
            record_penalty += (ph_std['min'] - r.soil_ph) * ph_std['penalty'] * ph_std['weight']
        elif r.soil_ph > ph_std['max']:
            record_penalty += (r.soil_ph - ph_std['max']) * ph_std['penalty'] * ph_std['weight']

        total_penalty += record_penalty

    # Tính điểm trung bình bị trừ trên toàn chu kỳ
    avg_penalty = total_penalty / record_count
    final_score = max(0.0, round(100.0 - avg_penalty, 1))

    # Xếp hạng sinh thái
    if final_score >= 90.0:
        grade = 'A'
    elif final_score >= 75.0:
        grade = 'B'
    elif final_score >= 50.0:
        grade = 'C'
    else:
        grade = 'D'

    return final_score, grade


def generate_qr_code(batch, base_url="http://localhost:5173"):
    """
    Sinh ảnh mã QR chứa URL tra cứu lô hàng trên Frontend React
    """
    trace_url = f"{base_url}/trace/{batch.batch_code}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(trace_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    filename = f"qr_{batch.batch_code}.png"
    
    # Lưu file ảnh trực tiếp vào trường ImageField của Batch
    batch.qr_code_image.save(filename, ContentFile(buffer.getvalue()), save=False)
    buffer.close()

# Alias để tương thích với cả 2 cách đặt tên import trong views.py
calculate_batch_eco_score = calculate_eco_score