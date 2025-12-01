from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, EmailOtp
from storefront.models import CustomerAccount
from .serializers import UserSerializer
import random
from django.core.cache import cache
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from .utils.captcha import validate_captcha  # you create this file

# --- Settings ---
LOGIN_ATTEMPT_LIMIT = 5         # Max attempts before freeze
LOGIN_ATTEMPT_WINDOW = 900      # 15 minutes in seconds
CAPTCHA_THRESHOLD = 3           # Show captcha after 3 fails


def get_login_key(identifier: str):
    return f"login_attempts_{identifier}"


def get_attempts(identifier: str):
    data = cache.get(get_login_key(identifier))
    if not data:
        return {"count": 0, "blocked_until": None}
    return data


def increment_attempts(identifier: str):
    data = get_attempts(identifier)
    count = data["count"] + 1
    blocked_until = data["blocked_until"]

    if count >= LOGIN_ATTEMPT_LIMIT:
        blocked_until = timezone.now() + timedelta(seconds=LOGIN_ATTEMPT_WINDOW)

    cache.set(
        get_login_key(identifier),
        {"count": count, "blocked_until": blocked_until},
        timeout=LOGIN_ATTEMPT_WINDOW,
    )
    return count, blocked_until


def reset_attempts(identifier: str):
    cache.delete(get_login_key(identifier))


def get_client_ip(request):
    """Best-effort client IP extraction behind proxies."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        # X-Forwarded-For: client, proxy1, proxy2
        ip = xff.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        captcha_token = request.data.get("captcha_token")
        ip = get_client_ip(request)
        


        if not email or not password:
            return Response({"detail": "Email and password required."}, status=400)

        identifier = email or ip
        attempts = get_attempts(identifier)
        ip_attempts = get_attempts(ip) if ip else {"count": 0, "blocked_until": None}
        # derive combined state across email and IP
        blocked_until_any = None
        for b in (attempts.get("blocked_until"), ip_attempts.get("blocked_until")):
            if b and (not blocked_until_any or b > blocked_until_any):
                blocked_until_any = b
        combined_count = max(attempts.get("count", 0), ip_attempts.get("count", 0))
        captcha_required = combined_count >= CAPTCHA_THRESHOLD

        if getattr(settings, "CAPTCHA_DEBUG", False):
            print(
                "[CAPTCHA-DEBUG] attempts:",
                {
                    "email": email,
                    "ip": ip,
                    "email_count": attempts.get("count", 0),
                    "ip_count": ip_attempts.get("count", 0),
                    "combined": combined_count,
                    "blocked_email": str(attempts.get("blocked_until")),
                    "blocked_ip": str(ip_attempts.get("blocked_until")),
                    "captcha_required": captcha_required,
                    "token_present": bool(captcha_token),
                },
            )

        # 🚫 Block if frozen
        if blocked_until_any and timezone.now() < blocked_until_any:
            remaining = (blocked_until_any - timezone.now()).seconds
            return Response(
                {
                    "detail": f"Too many attempts. Try again in {remaining//60}m {remaining%60}s.",
                    "blocked_until": blocked_until_any,
                },
                status=403,
            )

        # 🔐 Require captcha after threshold
        if combined_count >= CAPTCHA_THRESHOLD:
            if not captcha_token or not validate_captcha(captcha_token, ip):
                if getattr(settings, "CAPTCHA_DEBUG", False):
                    print(
                        "[CAPTCHA-DEBUG] captcha missing/invalid:",
                        {"missing": not bool(captcha_token)},
                    )
                # count captcha failures towards rate limits
                increment_attempts(identifier)
                if ip:
                    increment_attempts(ip)
                return Response(
                    {"detail": "Captcha required or invalid.", "captcha_required": True},
                    status=400,
                )

        # ✅ Try authenticate
        user = authenticate(request, email=email, password=password)
        if user:
            if email:
                reset_attempts(email)
            if ip:
                reset_attempts(ip)
            refresh = RefreshToken.for_user(user)
            return Response(
                {"access": str(refresh.access_token), "refresh": str(refresh)},
                status=200,
            )

        # ❌ Wrong credentials
        count_email, blocked_email = increment_attempts(identifier)
        count_ip, blocked_ip = increment_attempts(ip) if ip else (0, None)
        count = max(count_email, count_ip)
        blocked_until = blocked_email
        if blocked_ip and (not blocked_until or blocked_ip > blocked_until):
            blocked_until = blocked_ip
        if getattr(settings, "CAPTCHA_DEBUG", False):
            print(
                "[CAPTCHA-DEBUG] wrong credentials:",
                {
                    "email": email,
                    "ip": ip,
                    "count_email": count_email,
                    "count_ip": count_ip,
                    "blocked_until": str(blocked_until),
                },
            )
        print("📩 Incoming Login Request:", request.data)
        print("📊 Attempts:", attempts)
        print("Captcha Token Received:", captcha_token)
        return Response(
            {
                "detail": "Invalid credentials.",
                "attempts": count,
                "captcha_required": count >= CAPTCHA_THRESHOLD,
                "blocked_until": blocked_until,
            },
            status=401,
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    # def perform_update(self, serializer):
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)  # allow PATCH
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # ✅ Always return updated profile
        return Response(serializer.data, status=status.HTTP_200_OK)


def _generate_code():
    return f"{random.randint(0, 999999):06d}"


class SendOtpView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        purpose = request.data.get('purpose')  # 'login' | 'reset'
        if not email or purpose not in ("login", "reset", "signup_customer"):
            return Response({"detail": "email and valid purpose required"}, status=400)

        # For customer signup we allow non-existent emails; for login/reset require existing account
        if purpose in ("login", "reset"):
            user_exists = User.objects.filter(email=email).exists()
            customer_exists = CustomerAccount.objects.filter(email=email).exists()
            if not user_exists and not customer_exists:
                return Response({"detail": "No account found with that email."}, status=404)

        code = _generate_code()
        EmailOtp.objects.create(email=email, code=code, purpose=purpose)

        try:
            send_mail(
                subject="Your OTP Code",
                message=f"Your {purpose} OTP code is: {code}. It expires in 10 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as exc:
            return Response({"detail": str(exc)}, status=500)

        return Response({"success": True})


class VerifyOtpView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        purpose = request.data.get('purpose')
        if not (email and code and purpose in ("login", "reset", "signup_customer")):
            return Response({"detail": "email, code and valid purpose required"}, status=400)

        otp = EmailOtp.objects.filter(email=email, code=code, purpose=purpose, is_used=False).order_by('-created_at').first()
        if not otp or not otp.is_valid():
            return Response({"detail": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save()

        if purpose == "login":
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"detail": "Account not found"}, status=404)
            refresh = RefreshToken.for_user(user)
            return Response({"access": str(refresh.access_token), "refresh": str(refresh)})
        elif purpose == "reset":
            return Response({"reset_token": f"rst_{otp.id}"})
        else:
            return Response({"signup_token": f"sup_{otp.id}"})


class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not (email and token and new_password):
            return Response({"detail": "email, token and new_password required"}, status=400)

        if not token.startswith('rst_'):
            return Response({"detail": "Invalid token"}, status=400)
        try:
            otp_id = int(token.split('_', 1)[1])
            otp = EmailOtp.objects.get(id=otp_id, email=email, purpose='reset')
        except Exception:
            return Response({"detail": "Invalid token"}, status=400)

        if not otp.is_used:
            return Response({"detail": "OTP not verified"}, status=400)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({"success": True})
        except User.DoesNotExist:
            # Try resetting customer account password
            try:
                cust = CustomerAccount.objects.get(email=email)
                cust.set_password(new_password)
                cust.save()
                return Response({"success": True})
            except CustomerAccount.DoesNotExist:
                return Response({"detail": "Account not found"}, status=404)
