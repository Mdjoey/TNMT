from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='phone_number', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'phone_number', 'phone', 'address', 'is_verified']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'role', 'phone', 'address']

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Email này đã được sử dụng. Vui lòng chọn email khác.")
        return normalized

    def create(self, validated_data):
        password = validated_data.pop('password')
        phone = validated_data.pop('phone', '')
        email = validated_data.get('email').strip().lower()
        username = validated_data.get('username') or email.split('@')[0]
        
        # Đảm bảo không trùng lặp username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User(
            email=email,
            username=username,
            role=validated_data.get('role', User.Role.CUSTOMER),
            phone_number=phone,
            address=validated_data.get('address', ''),
        )
        user.set_password(password)
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'username' in self.fields:
            self.fields.pop('username')

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Email hoặc mật khẩu không chính xác."})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Email hoặc mật khẩu không chính xác."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "Tài khoản này hiện đang bị khóa."})

        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role,
                'phone': user.phone_number or '',
                'address': user.address or '',
            }
        }