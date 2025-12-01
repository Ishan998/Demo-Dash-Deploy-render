from django.db import models

# Create your models here.
from django.db import models
from users.models import User
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Customer(TimestampedModel):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default='active')
    def __str__(self):
        return self.name





class Product(TimestampedModel):
    STATUS_CHOICES = [
    ('in_stock', 'In Stock'),
    ('out_of_stock', 'Out of Stock'),
    ('discontinued', 'Discontinued'),
]

    name = models.CharField(max_length=255)
    crystal_name = models.CharField(max_length=255, blank=True, null=True)  # 💎 Added field

    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)

    gst = models.CharField(max_length=10, blank=True, null=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_stock')

    main_category = models.CharField(max_length=100, blank=True, null=True)
    sub_category = models.CharField(max_length=100, blank=True, null=True)

    materials = models.JSONField(default=list, blank=True)
    colors = models.JSONField(default=list, blank=True)
    sizes = models.JSONField(default=list, blank=True)
    occasions = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    # 🔹 New fields you must add:
    product_specification = models.TextField(blank=True, null=True)
    # stone_type = models.CharField(max_length=100, blank=True, null=True)
    unique_code = models.CharField(max_length=50, blank=True, null=True, unique=True)
    delivery_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    delivery_width  = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    delivery_height = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    delivery_depth = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    delivery_days = models.PositiveIntegerField(blank=True, null=True)
    delivery_charges = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    return_charges = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    limited_deal_ends_at = models.DateTimeField(blank=True, null=True)


    is_returnable = models.BooleanField(default=True)

    # 🧠 Restrict to max 6 images
    def clean(self):
        if self.images and len(self.images) > 6:
            raise ValidationError("You can upload a maximum of 6 images per product.")

    # 🔄 Auto-set status based on stock
    # def save(self, *args, **kwargs):
    #     if self.stock <= 0:
    #         self.status = 'out_of_stock'
    #     else:
    #         self.status = 'in_stock'
    #     self.full_clean()  # ✅ Runs the clean() method to validate images count
    #     super().save(*args, **kwargs)

    # def __str__(self):
    #     return f"{self.name} ({'In Stock' if self.stock > 0 else 'Out of Stock'})"
    def save(self, *args, **kwargs):
    # Only auto-set status if not manually assigned
        if not self.status:
            if self.stock <= 0:
                self.status = 'out_of_stock'
            else:
                self.status = 'in_stock'

        self.full_clean()  # Runs image validation etc.
        super().save(*args, **kwargs)


class ProductVariant(TimestampedModel):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)

    name = models.CharField(max_length=255, blank=True, null=True)
    sku = models.CharField(max_length=50, blank=True, null=True)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)

    images = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    colors = models.JSONField(default=list, blank=True)
    sizes = models.JSONField(default=list, blank=True)
    # Optional link to a Rich Product Description for this variant
    rpd = models.ForeignKey('RichProductDescription', on_delete=models.SET_NULL, null=True, blank=True)

    def clean(self):
        if self.images and len(self.images) > 6:
            raise ValidationError("Max 6 images allowed for each variant.")

    def save(self, *args, **kwargs):
        if self.selling_price > self.mrp:
            raise ValidationError("Selling price cannot exceed MRP")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - {self.name or 'Variant'}"
    
    class Meta:
        unique_together = ("product", "sku")


class Order(TimestampedModel):
    PAYMENT_CHOICES = [
        ('prepaid', 'Pre-Paid'),
        ('cod', 'Cash on Delivery'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE,related_name="orders")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='cod')

    # Charges and taxes
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # e.g., 18.00
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Shipping address
    address_line1 = models.CharField(max_length=255,blank=True, null=True)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100,blank=True,null=True)
    state = models.CharField(max_length=100,blank=True,null=True)
    pincode = models.CharField(max_length=10,blank=True,null=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)  # optional link
    name = models.CharField(max_length=255)  # store product name snapshot
    sku = models.CharField(max_length=50, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    
class Discount(TimestampedModel):
    
    # name = models.CharField(max_length=255,null=True)   # 👈 add this
    # code = models.CharField(max_length=50, null=True)
    name = models.CharField(max_length=255, blank=False, null=False)
    code = models.CharField(max_length=50, unique=True, blank=False, null=False)
    type = models.CharField(                  # e.g. "percentage" or "fixed"
        max_length=20,
        choices=[('percentage', 'Percentage'), ('fixed', 'Fixed Amount')],
        default='percentage'
    )
    value = models.FloatField(default=0)      # discount value
    status = models.CharField(                # 👈 add this
        max_length=20,
        choices=[('active', 'Active'), ('inactive', 'Inactive'), ('scheduled', 'Scheduled')],
        default='inactive'
    )
    usage_limit = models.IntegerField(null=True, blank=True)
    usage_limit_per_customer = models.IntegerField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    # Applies-to configuration: either applies to all products or specific products
    applies_to_type = models.CharField(
        max_length=32,
        choices=[('all_products', 'All Products'), ('specific_products', 'Specific Products')],
        default='all_products'
    )
    applies_to_products = models.ManyToManyField(
        'Product', blank=True, related_name='discounts_applied'
    )

# class Banner(models.Model):
#     STATUS_CHOICES = [
#         ('Active', 'Active'),
#         ('Inactive', 'Inactive'),
#         ('Scheduled', 'Scheduled'),
#     ]

#     title = models.CharField(max_length=255)
#     image = models.ImageField(upload_to='banners/', blank=True, null=True)  # file upload
#     start_date = models.DateField(blank=True, null=True)
#     end_date = models.DateField(blank=True, null=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Inactive')

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return self.title

class Banner(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Scheduled', 'Scheduled'),
    ]

    DEVICE_CHOICES = [
        ('All', 'All'),
        ('Mobile', 'Mobile'),
        ('Desktop', 'Desktop'),
    ]

    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='banners/', blank=True, null=True)
    redirect_url = models.URLField(blank=True, null=True, help_text="Optional link for banner click-through")
    display_order = models.PositiveIntegerField(default=0, help_text="Lower = higher priority")
    device_type = models.CharField(max_length=10, choices=DEVICE_CHOICES, default='All')

    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Inactive')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_active(self):
        """Check if the banner is currently active based on dates and status."""
        today = timezone.now().date()
        if self.status != "Active":
            return False
        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        return True

    def __str__(self):
        return self.title
    
class MainCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.name

class SubCategory(models.Model):
    name = models.CharField(max_length=100)
    main_category = models.ForeignKey(MainCategory, on_delete=models.CASCADE, related_name="subcategories", null=True, blank=True)
    def __str__(self):
        return self.name

class Material(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class Color(models.Model):
    name = models.CharField(max_length=50)
    hex_code = models.CharField(max_length=7, blank=True, null=True)
    def __str__(self):
        return self.name

class Occasion(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class HomeCollageItem(TimestampedModel):
    ITEM_TYPES = [
        ("occasion", "Occasion"),
        ("crystal", "Crystal"),
        ("product_type", "Product Type"),
    ]

    name = models.CharField(max_length=120)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    image = models.ImageField(upload_to="collages/", blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    grid_class = models.CharField(max_length=80, blank=True, default="")
    display_order = models.PositiveIntegerField(default=0)
    redirect_url = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ["display_order", "name", "id"]

    def __str__(self):
        return f"{self.name} ({self.item_type})"

    @property
    def resolved_image(self):
        if self.image:
            return self.image.url
        return self.image_url

class RPD(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()

class RPDProductLink(models.Model):
    product = models.OneToOneField('Product', on_delete=models.CASCADE, unique=True)  
    rpd = models.ForeignKey('RichProductDescription', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('product',)  # ✅ ensures each product is linked once


class Note(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(blank=True, default="")

class Notification(TimestampedModel):
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)   # ✅ add this
    type = models.CharField(max_length=50, default="info")  # ✅ maps to NotificationType


class RichProductDescription(models.Model):
    title = models.CharField(max_length=255)
    content = models.JSONField()   # ✅ instead of TextField
    products = models.ManyToManyField(
        'Product',
        through='RPDProductLink',
        related_name='rpd'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
class VisitorRegionData(models.Model):
    region = models.CharField(max_length=100)
    visitors = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.region}: {self.visitors}"

class ActivityLog(models.Model):
    LOG_TYPES = [
        ("info", "Info"),
        ("success", "Success"),
        ("warning", "Warning"),
        ("error", "Error"),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="activity_logs")
    message = models.TextField()
    type = models.CharField(max_length=20, choices=LOG_TYPES, default="info")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.type.upper()}] {self.message[:50]}"
