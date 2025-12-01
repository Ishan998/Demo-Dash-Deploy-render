# from django.urls import path
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# urlpatterns = [
#     path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
#     path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
# ]
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserProfileView, SendOtpView, VerifyOtpView, PasswordResetConfirmView, LoginView
from .serializers import EmailTokenObtainPairSerializer
class CustomTokenView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="custom_login"),   # 👈 add this
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/profile/", UserProfileView.as_view(), name="user_profile"),
    path("auth/otp/send/", SendOtpView.as_view(), name="send_otp"),
    path("auth/otp/verify/", VerifyOtpView.as_view(), name="verify_otp"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
]
