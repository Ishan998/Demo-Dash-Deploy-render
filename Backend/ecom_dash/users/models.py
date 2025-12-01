# from django.db import models

# # Create your models here.
# from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
# from django.db import models

# class UserManager(BaseUserManager):
#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError("Email is required")
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)
#         user.save()
#         return user

#     def create_superuser(self, email, password=None, **extra_fields):
#         extra_fields.setdefault("is_staff", True)
#         extra_fields.setdefault("is_superuser", True)
#         return self.create_user(email, password, **extra_fields)

# class User(AbstractBaseUser, PermissionsMixin):
#     email = models.EmailField(unique=True)
#     full_name = models.CharField(max_length=255, blank=True)
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)

#     USERNAME_FIELD = "email"
#     REQUIRED_FIELDS = []

#     objects = UserManager()

#     def __str__(self):
#         return self.email
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
# from django.utils import timezone
# from datetime import timedelta
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # --- Basic Info ---
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    recovery_email = models.EmailField(blank=True, null=True)
    avatar = models.TextField(blank=True, null=True)  # store base64 if needed
    role = models.CharField(max_length=100, blank=True, null=True)

    # --- Business Details ---
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_address = models.TextField(blank=True, null=True)
    gst_number = models.CharField(max_length=20, blank=True, null=True)
    pan_card = models.CharField(max_length=20, blank=True, null=True)

    # --- Notification Settings ---
    notify_orders = models.BooleanField(default=True)
    notify_promotions = models.BooleanField(default=True)
    notify_updates = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class EmailOtp(models.Model):
    PURPOSE_CHOICES = (
        ("login", "Login"),
        ("reset", "Password Reset"),
        ("signup_customer", "Customer Signup"),
    )
    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        return (not self.is_used) and timezone.now() <= self.expires_at



LOGIN_ATTEMPT_LIMIT = 5   # Max attempts before freeze
LOGIN_ATTEMPT_WINDOW = 900  # 15 minutes in seconds
CAPTCHA_THRESHOLD = 3    # Show captcha after 3 failed attempts


def get_login_key(email_or_ip):
    return f"login_attempts_{email_or_ip}"


def get_attempts(email_or_ip):
    data = cache.get(get_login_key(email_or_ip))
    if not data:
        return {"count": 0, "blocked_until": None}
    return data


def increment_attempts(email_or_ip):
    data = get_attempts(email_or_ip)
    count = data["count"] + 1
    blocked_until = data["blocked_until"]

    if count >= LOGIN_ATTEMPT_LIMIT:
        blocked_until = timezone.now() + timedelta(seconds=LOGIN_ATTEMPT_WINDOW)

    cache.set(
        get_login_key(email_or_ip),
        {"count": count, "blocked_until": blocked_until},
        timeout=LOGIN_ATTEMPT_WINDOW,
    )
    return count, blocked_until


def reset_attempts(email_or_ip):
    cache.delete(get_login_key(email_or_ip))
