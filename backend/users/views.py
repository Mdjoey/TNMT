from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        # Đảm bảo luôn có các trường thông tin giao hàng
        data['full_name'] = user.get_full_name() or user.username
        data['phone'] = getattr(user, 'phone', '') or getattr(user, 'phone_number', '') or ''
        data['address'] = getattr(user, 'address', '') or ''
        return Response(data)

    def put(self, request):
        user = request.user
        data = request.data
        
        # Cập nhật tên
        if 'full_name' in data:
            name_parts = data['full_name'].strip().split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Cập nhật số điện thoại
        if 'phone' in data:
            if hasattr(user, 'phone'):
                user.phone = data['phone']
            elif hasattr(user, 'phone_number'):
                user.phone_number = data['phone']

        # Cập nhật địa chỉ
        if 'address' in data and hasattr(user, 'address'):
            user.address = data['address']

        user.save()
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            res_data = serializer.data
            res_data['full_name'] = user.get_full_name() or user.username
            res_data['phone'] = getattr(user, 'phone', '') or getattr(user, 'phone_number', '') or ''
            res_data['address'] = getattr(user, 'address', '') or ''
            return Response(res_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)