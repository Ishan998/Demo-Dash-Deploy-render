from rest_framework import serializers
from django.db import models
from decimal import Decimal
from api.models import Product, ProductVariant, Discount, RPDProductLink, RichProductDescription, Order, OrderItem
from .models import CustomerAccount, Address, WishlistItem, CartItem, ProductReview

class ProductVariantMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "sku", "mrp", "selling_price", "stock", "images", "tags", "colors", "sizes", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and data.get("images"):
            data["images"] = [
                img if isinstance(img, str) and img.startswith("http") else request.build_absolute_uri(img)
                for img in data.get("images") or []
            ]
        return data

class ProductListSerializer(serializers.ModelSerializer):
    variants = ProductVariantMiniSerializer(many=True, read_only=True)
    rating_summary = serializers.SerializerMethodField()
    # sellingPrice = serializers.DecimalField(source="selling_price", max_digits=10, decimal_places=2)
    # originalPrice = serializers.DecimalField(source="mrp", max_digits=10, decimal_places=2)
    # mainCategory = serializers.CharField(source="main_category")
    # subCategory = serializers.CharField(source="sub_category")
    class Meta:
        model = Product
        fields = [
            "id", "name", "unique_code", "selling_price", "mrp", "stock", "status",
            "images", "tags", "main_category", "sub_category", "variants", "limited_deal_ends_at",
            # Charges & logistics (needed in cart/checkout summaries)
            "gst", "delivery_charges", "delivery_days",
            "delivery_weight", "delivery_width", "delivery_height", "delivery_depth", "return_charges",
            # Expose filterable attributes for list view filtering
            "materials", "colors", "sizes", "occasions", "crystal_name",
            "rating_summary",
        ]

    def _rating_summary(self, obj):
        agg = obj.product_reviews.aggregate(
            average=models.Avg("rating"),
            count=models.Count("id"),
        )
        avg_val = agg.get("average")
        return {
            "average": float(avg_val) if avg_val is not None else None,
            "count": agg.get("count", 0),
        }

    def get_rating_summary(self, obj):
        return self._rating_summary(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and data.get("images"):
            data["images"] = [
                img if isinstance(img, str) and img.startswith("http") else request.build_absolute_uri(img)
                for img in data.get("images") or []
            ]
        # Ensure nested variants also receive the request context for absolute URLs
        if request and data.get("variants"):
            for variant in data["variants"]:
                if isinstance(variant, dict) and variant.get("images"):
                    variant["images"] = [
                        img if isinstance(img, str) and img.startswith("http") else request.build_absolute_uri(img)
                        for img in variant.get("images") or []
                    ]
        return data

class RPDBlockSerializer(serializers.Serializer):
    # passthrough of JSON blocks already saved in RichProductDescription.content
    # (kept for explicit typing)
    type = serializers.CharField()
    data = serializers.JSONField()

class ProductDetailSerializer(serializers.ModelSerializer):
    variants = ProductVariantMiniSerializer(many=True, read_only=True)
    rpd = serializers.SerializerMethodField()
    active_discounts = serializers.SerializerMethodField()
    discount_pricing = serializers.SerializerMethodField()
    rating_summary = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"

    def get_rpd(self, obj):
        link = RPDProductLink.objects.filter(product=obj).select_related("rpd").first()
        if not link:
            return None
        r: RichProductDescription = link.rpd
        return {
            "id": r.id,
            "title": r.title,
            "content": r.content,  # JSON blocks for your RPD editor on UI
        }

    def _active_discounts_qs(self, obj):
        from django.utils import timezone
        today = timezone.localdate()
        # Treat "active" status as the source of truth; suppress only expired discounts.
        qs = (
            obj.discounts_applied.filter(status="active").filter(
                models.Q(end_date__isnull=True) | models.Q(end_date__gte=today),
            )
        )
        # Plus global discounts (applies_to_type='all_products')
        global_qs = Discount.objects.filter(
            status="active",
            applies_to_type="all_products",
        ).filter(
            models.Q(end_date__isnull=True)   | models.Q(end_date__gte=today),
        )
        qs = (qs | global_qs).distinct()
        return qs

    def get_active_discounts(self, obj):
        qs = list(self._active_discounts_qs(obj))
        qs.sort(key=lambda d: 0 if getattr(d, "applies_to_type", "") == "specific_products" else 1)
        base_price = Decimal(str(obj.selling_price or obj.mrp or 0))
        return [
            {
                "id": d.id,
                "name": d.name,
                "code": d.code,
                "type": d.type,
                "display_type": "Flat" if d.type == "fixed" else "Percentage",
                "applies_to": d.applies_to_type,
                "value": d.value,
                # Pre-compute amount_off/final_price so the frontend does not need to branch on type
                "amount_off": (
                    (base_price * Decimal(str(d.value)) / Decimal("100")).quantize(Decimal("0.01"))
                    if d.type == "percentage"
                    else Decimal(str(d.value)).quantize(Decimal("0.01"))
                ),
                "final_price": (
                    (base_price * (Decimal("1") - Decimal(str(d.value)) / Decimal("100")))
                    if d.type == "percentage"
                    else (base_price - Decimal(str(d.value)))
                ).max(Decimal("0")).quantize(Decimal("0.01")),
                "start_date": d.start_date,
                "end_date": d.end_date,
            }
            for d in qs
        ]

    def get_discount_pricing(self, obj):
        """
        Compute the best available discount for this product and surface
        the resulting price + savings so the UI can display the applied
        discount (including whether it is flat or percentage).
        """
        qs = list(self._active_discounts_qs(obj))
        specific_first = [d for d in qs if getattr(d, "applies_to_type", "") == "specific_products"]
        candidates = specific_first or qs  # Prefer product-specific coupons when present
        base = Decimal(str(obj.selling_price or obj.mrp or 0))
        best_price = base
        best = None

        for d in candidates:
            price = base
            if d.type == "percentage":
                price = base * (Decimal("1") - Decimal(str(d.value)) / Decimal("100"))
            elif d.type == "fixed":
                price = base - Decimal(str(d.value))
            if price < Decimal("0"):
                price = Decimal("0")

            if best is None or price < best_price:
                best_price = price
                best = d

        if best is None:
            return {
                "base_price": base,
                "final_price": base,
                "savings": Decimal("0"),
                "applied": None,
            }

        savings = (base - best_price) if base > best_price else Decimal("0")
        return {
            "base_price": base,
            "final_price": best_price.quantize(Decimal("0.01")),
            "savings": savings.quantize(Decimal("0.01")),
            "applied": {
                "id": best.id,
                "code": best.code,
                "name": best.name,
                "type": best.type,
                "display_type": "Flat" if best.type == "fixed" else "Percentage",
                "value": best.value,
                "applies_to": best.applies_to_type,
            },
        }
    
    def get_rating_summary(self, obj):
        agg = obj.product_reviews.aggregate(
            average=models.Avg("rating"),
            count=models.Count("id"),
        )
        avg_val = agg.get("average")
        return {
            "average": float(avg_val) if avg_val is not None else None,
            "count": agg.get("count", 0),
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and data.get("images"):
            data["images"] = [
                img if isinstance(img, str) and img.startswith("http") else request.build_absolute_uri(img)
                for img in data.get("images") or []
            ]
        if request and data.get("variants"):
            for variant in data["variants"]:
                if isinstance(variant, dict) and variant.get("images"):
                    variant["images"] = [
                        img if isinstance(img, str) and img.startswith("http") else request.build_absolute_uri(img)
                        for img in variant.get("images") or []
                    ]
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    class Meta:
        model = CustomerAccount
        fields = ["id", "name", "email", "phone", "password"]

    def validate_email(self, value):
        if CustomerAccount.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        if value and CustomerAccount.objects.filter(phone=value, is_active=True).exists():
            raise serializers.ValidationError("An active account with this phone number already exists.")
        return value

    def create(self, validated_data):
        pwd = validated_data.pop("password")
        customer = CustomerAccount(**validated_data)
        customer.set_password(pwd)
        customer.save()
        return customer

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAccount
        fields = ["id", "name", "email", "phone"]
        read_only_fields = ["id", "email"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAccount
        fields = ["id", "name", "email", "phone"]
        read_only_fields = ["id", "email"]

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "line1", "line2", "city", "state", "pincode", "is_default"]

class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "created_at"] # product_id is write-only

    def create(self, validated_data):
        # ✅ Attach product & customer correctly
        # 🔍 DEBUG: [serializers.py] Creating WishlistItem.
        print(f"🔍 DEBUG: [WishlistItemSerializer.create] Validated data: {validated_data}")
        product_id = validated_data.pop("product_id")
        customer = self.context["request"].customer
        print(f"🔍 DEBUG: [WishlistItemSerializer.create] Customer ID: {customer.id}, Product ID: {product_id}")
        product = Product.objects.get(id=product_id)

        # ✅ Prevent duplicates (unique_together constraint)
        wishlist_item, created = WishlistItem.objects.get_or_create(
            customer=customer,
            product=product
        )
        # 🔍 DEBUG: [serializers.py] WishlistItem get_or_create result.
        status = "CREATED" if created else "ALREADY_EXISTED"
        print(f"🔍 DEBUG: [WishlistItemSerializer.create] Wishlist item status: {status}")
        return wishlist_item


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity", "created_at"]


class ProductReviewSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    order_id = serializers.IntegerField(write_only=True)
    customer_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product_id",
            "order_id",
            "rating",
            "title",
            "comment",
            "customer_name",
            "product_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "customer_name", "product_name", "created_at", "updated_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        customer = getattr(request, "customer", None)
        if not customer:
            raise serializers.ValidationError("Authentication required to submit a review.")

        product_id = attrs.get("product_id") or self.initial_data.get("product_id")
        order_id = attrs.get("order_id") or self.initial_data.get("order_id")
        if not product_id or not order_id:
            raise serializers.ValidationError("product_id and order_id are required.")

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found.")

        # Confirm the order belongs to the same customer email
        if order.customer and order.customer.email.lower() != customer.email.lower():
            raise serializers.ValidationError("This order does not belong to the signed-in customer.")

        # Only allow reviews once the order is completed/delivered
        status_value = (order.status or "").strip().lower()
        if status_value not in ("completed", "delivered"):
            raise serializers.ValidationError("You can review a product only after the order is completed.")

        order_item = order.items.filter(product_id=product_id).first()
        if not order_item:
            raise serializers.ValidationError("This product is not part of the selected order.")

        # Enforce single review per customer + order + product
        if ProductReview.objects.filter(customer=customer, order=order, product=product).exists():
            raise serializers.ValidationError("You have already reviewed this product for this order.")

        attrs["customer"] = customer
        attrs["product"] = product
        attrs["order"] = order
        attrs["order_item"] = order_item
        attrs.pop("product_id", None)
        attrs.pop("order_id", None)
        return attrs

    def get_customer_name(self, obj):
        return getattr(obj.customer, "name", None) or getattr(obj.customer, "email", None)

    def get_product_name(self, obj):
        return getattr(obj.product, "name", None) or f"Product #{obj.product_id}"

    def create(self, validated_data):
        return ProductReview.objects.create(**validated_data)


class StorefrontOrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "name", "sku", "price", "quantity", "productId"]

    def get_productId(self, obj):
        return obj.product_id


class StorefrontOrderSerializer(serializers.ModelSerializer):
    items = StorefrontOrderItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(source="total_amount", max_digits=10, decimal_places=2, coerce_to_string=False)
    date = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Order
        fields = ["id", "status", "payment_method", "total", "date", "items"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["status"] = (getattr(instance, "status", "") or "").lower()
        return data
