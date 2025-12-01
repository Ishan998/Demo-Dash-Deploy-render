from django.db import models

# Create your models here.
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password

# We reference your existing API models (no duplication)
# - api.Product
# - api.ProductVariant
# - api.Discount
# - api.RichProductDescription
# - api.Order / api.OrderItem (we will create orders in views)

class Timestamped(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class CustomerAccount(Timestamped):
    """
    Separate customer table (not your admin users.User).
    Minimal fields + password hashing handled here.
    """
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    password_hash = models.CharField(max_length=256)
    is_active = models.BooleanField(default=True)

    def set_password(self, raw_password: str):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return f"{self.name} <{self.email}>"

    @property
    def is_authenticated(self):
        # Allows DRF permission checks (IsAuthenticated) to treat CustomerAccount as an authenticated user.
        return True

class CustomerSessionToken(Timestamped):
    """
    Lightweight token for CustomerAccount authentication.
    """
    customer = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE, related_name="tokens")
    key = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        return self.expires_at is None or self.expires_at > timezone.now()

class Address(Timestamped):
    customer = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE, related_name="addresses")
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True, null=True)
    city  = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.customer.email} - {self.line1}, {self.city}"

class WishlistItem(Timestamped):
    customer = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE, related_name="wishlist")
    product = models.ForeignKey("api.Product", on_delete=models.CASCADE, related_name="storefront_wishlist_items")

    class Meta:
        unique_together = ("customer", "product")

class CartItem(Timestamped):
    customer = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE, related_name="cart")
    product = models.ForeignKey("api.Product", on_delete=models.CASCADE, related_name="storefront_cart_items")
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("customer", "product")


class ProductReview(Timestamped):
    """
    Review tied to a specific product purchase. A customer can leave only
    one review per product within an order once the order is completed.
    """
    customer = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE, related_name="reviews")
    order = models.ForeignKey("api.Order", on_delete=models.CASCADE, related_name="product_reviews")
    order_item = models.ForeignKey("api.OrderItem", on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    product = models.ForeignKey("api.Product", on_delete=models.CASCADE, related_name="product_reviews")
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True, default="")
    comment = models.TextField(blank=True, default="")
    is_verified = models.BooleanField(default=True)

    class Meta:
        unique_together = ("customer", "order", "product")
        ordering = ["-created_at"]

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.rating < 1 or self.rating > 5:
            raise ValidationError("Rating must be between 1 and 5.")

    def __str__(self):
        return f"{self.product} - {self.rating} stars by {self.customer}"

