from django.shortcuts import render
import logging

# Create your views here.
from django.db.models import Q, F
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response

from api.models import Product, ProductVariant, Order, OrderItem, HomeCollageItem, Customer
from api.models import MainCategory, SubCategory, Material, Color, Occasion
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    RegisterSerializer, LoginSerializer, CustomerProfileSerializer,
    AddressSerializer, WishlistItemSerializer, CartItemSerializer, ProductReviewSerializer,
)
from api.serializers import HomeCollageItemSerializer
from .models import CustomerAccount, CustomerSessionToken, Address, WishlistItem, CartItem, ProductReview
from .auth import CustomerTokenAuthentication, issue_customer_token
from .permissions import IsCustomerAuthenticated
from api.models import Banner
from api.serializers import BannerSerializer
from datetime import date
from api.utils.email_utils import send_order_status_email

TAG_SYNONYMS = {
    "Limited Deal": ["Limited Deal", "Limited Offer", "Limited Offer Deals", "Limited Deals"],
    "Wedding Collection": ["Wedding Collection", "Wedding Collections", "Wedding Collecttions"],
}

logger = logging.getLogger(__name__)

# ---------------- Public Catalogue ----------------

class PublicProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /storefront/products/?search=&tag=&category=&inStock=true
    /storefront/products/{id}/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer
    queryset = Product.objects.all().prefetch_related("variants")

    def get_queryset(self):
        qs = self.queryset
        search = self.request.query_params.get("search")
        tag = self.request.query_params.get("tag")
        category = self.request.query_params.get("category")
        in_stock = self.request.query_params.get("inStock")

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(unique_code__icontains=search)
            )
        if tag:
            # tags is a JSONField (array). JSONB containment check.
            qs = qs.filter(tags__contains=[tag])
        if category:
            qs = qs.filter(Q(main_category__iexact=category) | Q(sub_category__iexact=category))
        if in_stock == "true":
            qs = qs.exclude(status="out_of_stock")

        return qs.order_by("-updated_at", "-created_at")

    def retrieve(self, request, *args, **kwargs):
        product = self.get_object()
        # Pass context to the serializer to build full image URLs
        data = ProductDetailSerializer(product, context={'request': request}).data

        # Suggested products: share any tag or same main_category (exclude self)
        tags = product.tags or []
        sug_q = Product.objects.exclude(id=product.id)
        if product.main_category:
            sug_q = sug_q.filter(
                Q(main_category__iexact=product.main_category) |
                Q(tags__overlap=tags)   # Postgres-specific; if not available, fallback below
            )
        else:
            if tags:
                sug_q = sug_q.filter(tags__overlap=tags)
        suggestions = sug_q[:12]
        data["suggested"] = ProductListSerializer(suggestions, many=True).data
        return Response(data, status=200)

# ---------------- Catalog Meta (Categories/Materials) ----------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_main_categories(_request):
    cats = list(MainCategory.objects.all().order_by("name").values("id", "name"))
    return Response({"categories": cats}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_materials(_request):
    mats = list(Material.objects.all().order_by("name").values("id", "name"))
    return Response({"materials": mats}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_colors(_request):
    cols = list(Color.objects.all().order_by("name").values("id", "name", "hex_code"))
    return Response({"colors": cols}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_crystals(_request):
    names = (
        Product.objects
        .exclude(crystal_name__isnull=True)
        .exclude(crystal_name="")
        .values_list("crystal_name", flat=True)
        .distinct()
        .order_by("crystal_name")
    )
    return Response({"crystals": list(names)}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_subcategories(_request):
    subs = (
        SubCategory.objects.select_related("main_category")
        .all()
        .annotate(main_category_name=F("main_category__name"))
        .order_by("name")
        .values("id", "name", "main_category_id", "main_category_name")
    )
    formatted = [
        {
            "id": s["id"],
            "name": s["name"],
            "main_category_id": s["main_category_id"],
            "main_category_name": s.get("main_category_name"),
        }
        for s in subs
    ]
    return Response({"subcategories": formatted}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_occasions(_request):
    occs = list(Occasion.objects.all().order_by("name").values("id", "name"))
    return Response({"occasions": occs}, status=200)

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def list_collage_items(request):
    """
    Public feed for homepage collage tiles (Shop by Occasion / Shop by Crystal).
    """
    item_type = request.query_params.get("type")
    qs = HomeCollageItem.objects.all().order_by("display_order", "name", "id")
    if item_type in ("occasion", "crystal"):
        qs = qs.filter(item_type=item_type)

    data = HomeCollageItemSerializer(qs, many=True, context={"request": request}).data
    if item_type:
        return Response({"items": data}, status=200)

    grouped = {"occasion": [], "crystal": [], "product_type": []}
    for item in data:
        grouped.setdefault(item["item_type"], []).append(item)
    return Response(grouped, status=200)

# ---------------- Home Sections (Sliders by Tag) ----------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def products_by_tag(request):
    tag = request.query_params.get("tag")
    if not tag:
        return Response({"error": "Tag is required"}, status=400)

    limit = request.query_params.get("limit", 24)
    try:
        limit = int(limit)
    except ValueError:
        limit = 24

    products = Product.objects.exclude(status="discontinued").prefetch_related("variants")
    filtered = []

    canonical_tag = next((k for k, vals in TAG_SYNONYMS.items() if tag in vals or tag == k), tag)
    tag_choices = TAG_SYNONYMS.get(canonical_tag, [tag])
    now = timezone.now()

    def has_any_tag(prod):
        tags = prod.tags or []
        if any(t in tags for t in tag_choices):
            return True
        for v in prod.variants.all():
            if v.tags and any(t in v.tags for t in tag_choices):
                return True
        return False

    for p in products:
        if canonical_tag == "Limited Deal" and getattr(p, "limited_deal_ends_at", None):
            try:
                if p.limited_deal_ends_at < now:
                    continue
            except Exception:
                pass

        if has_any_tag(p):
            filtered.append(p)

    qs = sorted(filtered, key=lambda x: (x.updated_at, x.created_at), reverse=True)[:limit]

    def map_badge(src_tag):
        base_tag = next((k for k, vals in TAG_SYNONYMS.items() if src_tag in vals or src_tag == k), src_tag)
        return {
            "Featured Products": "Featured",
            "Best Sellers": "Best Seller",
            "New Arrival": "New Arrivals",
            "Limited Deal": "Limited",
            "Limited Offer": "Limited",
            "Limited Deals": "Limited",
            "Wedding Collection": "Wedding Collection",
        }.get(base_tag, base_tag)

    cards = []
    for p in qs:
        v = None
        if hasattr(p, "variants") and p.variants.exists():
            v = p.variants.all().order_by("selling_price", "mrp", "-stock").first()

        price = float(v.selling_price) if v and v.selling_price is not None else float(p.selling_price or 0)
        originalPrice = float(v.mrp) if v and v.mrp is not None else float(p.mrp or 0)
        image = (v.images[0] if v and v.images else (p.images[0] if p.images else None))

        if image and request is not None and isinstance(image, str) and not image.startswith("http"):
            image = request.build_absolute_uri(image)

        cards.append({
            "id": p.id,
            "name": p.name,
            "price": price,
            "originalPrice": originalPrice if originalPrice else None,
            "imageUrl": image,
            "category": p.main_category or "",
            "badge": map_badge(canonical_tag),
            "inStock": (getattr(p, "status", None) != "out_of_stock") or (v.stock > 0 if v else (p.stock or 0) > 0),
            "dealEndsAt": p.limited_deal_ends_at.isoformat() if getattr(p, "limited_deal_ends_at", None) else None,
        })

    return Response(cards, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def home_sections(request):
    """
    Returns grouped product lists by the standard tag buckets for your homepage sliders.
    Example response keys: new_arrival, featured, festive_sale, best_sellers, limited_deal
    """
    TAG_MAP = {
        "new_arrival": "New Arrival",
        "featured": "Featured Products",
        "festive_sale": "Festive Sale",
        "best_sellers": "Best Sellers",
        "limited_deal": "Limited Deal",
        "wedding_collection": "Wedding Collection",
    }
    resp = {}
    products = Product.objects.exclude(status="discontinued").prefetch_related("variants")
    now = timezone.now()

    for key, tag in TAG_MAP.items():
        tag_choices = TAG_SYNONYMS.get(tag, [tag])
        matches = []
        for p in products:
            if tag == "Limited Deal" and getattr(p, "limited_deal_ends_at", None):
                try:
                    if p.limited_deal_ends_at < now:
                        continue
                except Exception:
                    pass

            tags = p.tags or []
            if any(t in tags for t in tag_choices):
                matches.append(p)
                continue
            for v in p.variants.all():
                if v.tags and any(t in v.tags for t in tag_choices):
                    matches.append(p)
                    break

        matches = sorted(matches, key=lambda x: x.updated_at, reverse=True)[:20]
        resp[key] = ProductListSerializer(matches, many=True, context={"request": request}).data
    return Response(resp, status=200)

# ---------------- Customer Auth & Profile ----------------

class CustomerAuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"])
    def register(self, request):
        signup_token = request.data.get("signup_token") or request.data.get("signupToken")
        if not signup_token or not str(signup_token).startswith("sup_"):
            return Response({"detail": "Valid signup_token required after OTP verification"}, status=400)

        # Validate OTP token
        try:
            from users.models import EmailOtp
            otp_id = int(str(signup_token).split("_", 1)[1])
            otp = EmailOtp.objects.get(id=otp_id, purpose="signup_customer")
            # For signup we expect OTP already marked used (verified). Only block if expired.
            if otp.expires_at < timezone.now():
                return Response({"detail": "OTP expired"}, status=400)
        except Exception:
            return Response({"detail": "Invalid signup_token"}, status=400)

        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        customer = s.save()
        token_obj = issue_customer_token(customer)
        return Response({"token": token_obj.key, "customer": {"id": customer.id, "name": customer.name, "email": customer.email}}, status=201)

    @action(detail=False, methods=["post"])
    def login(self, request):
        s = LoginSerializer(data=request.data)
        # 🔍 DEBUG: [views.py] Customer login attempt.
        # print(f"🔍 DEBUG: [CustomerAuthViewSet.login] Attempting login for: {request.data.get('email')}")
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]
        pwd = s.validated_data["password"]
        try:
            customer = CustomerAccount.objects.get(email=email)
        except CustomerAccount.DoesNotExist:
            return Response({"detail": "Invalid credentials"}, status=400)
        if not customer.check_password(pwd):
            return Response({"detail": "Invalid credentials"}, status=400)
        token_obj = issue_customer_token(customer)
        # 🔍 DEBUG: [views.py] Customer login successful.
        # print(f"🔍 DEBUG: [CustomerAuthViewSet.login] Login successful for: {email}")
        return Response({"token": token_obj.key, "customer": {"id": customer.id, "name": customer.name, "email": customer.email}}, status=200)

# ---------------- Customer Data (needs customer token) ----------------

class AddressViewSet(viewsets.ModelViewSet):
    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = [IsCustomerAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(customer=self.request.customer).order_by("-is_default", "-updated_at")

    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default", False):
            Address.objects.filter(customer=self.request.customer).update(is_default=False)
        serializer.save(customer=self.request.customer)

    def perform_update(self, serializer):
        if serializer.validated_data.get("is_default", False):
            Address.objects.filter(customer=self.request.customer).exclude(pk=self.get_object().pk).update(is_default=False)
        serializer.save()

class WishlistViewSet(viewsets.ModelViewSet):
    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = [IsCustomerAuthenticated]
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        # 🔍 DEBUG: [views.py] Fetching wishlist for customer.
        # print(f"🔍 DEBUG: [WishlistViewSet.get_queryset] Fetching wishlist for customer: {self.request.customer.id}")
        qs = WishlistItem.objects.filter(
            customer=self.request.customer
        ).select_related("product")
        # 🔍 DEBUG: [views.py] Found wishlist items.
        # print(f"🔍 DEBUG: [WishlistViewSet.get_queryset] Found {qs.count()} items.")
        return qs

    def get_serializer_context(self):
        return {"request": self.request}

    def perform_create(self, serializer):
        # 🔍 DEBUG: [views.py] Calling serializer.save() to create wishlist item.
        # print("🔍 DEBUG: [WishlistViewSet.perform_create] Calling serializer.save() to create wishlist item.")
        serializer.save()


class CustomerProfileViewSet(viewsets.ViewSet):
    """
    Allows authenticated customers to view/update their profile (name/phone). Email stays immutable.
    """
    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = [IsCustomerAuthenticated]
    serializer_class = CustomerProfileSerializer

    def get_object(self):
        return getattr(self.request, "customer", None)

    def retrieve(self, request, *args, **kwargs):
        customer = self.get_object()
        if not customer:
            return Response({"detail": "Auth required"}, status=401)
        data = self.serializer_class(customer).data
        return Response(data, status=200)

    def update(self, request, *args, **kwargs):
        customer = self.get_object()
        if not customer:
            return Response({"detail": "Auth required"}, status=401)
        serializer = self.serializer_class(customer, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data, status=200)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)


class CartViewSet(viewsets.ModelViewSet):
    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = [IsCustomerAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return (CartItem.objects
                .filter(customer=self.request.customer)
                .select_related("product")
                .order_by("-created_at"))

    def perform_create(self, serializer):
        serializer.save(customer=self.request.customer)

    def create(self, request, *args, **kwargs):
        """
        Upsert cart items so duplicate adds don't 500 on the unique_together constraint.
        """
        customer = getattr(request, "customer", None)
        if not customer:
            return Response({"detail": "Auth required"}, status=401)

        product_id = request.data.get("product_id") or request.data.get("product")
        quantity = request.data.get("quantity") or 1

        if not product_id:
            return Response({"detail": "product_id is required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found"}, status=404)

        try:
            cart_item, created = CartItem.objects.get_or_create(
                customer=customer,
                product=product,
                defaults={"quantity": quantity},
            )
            if not created:
                cart_item.quantity = (cart_item.quantity or 0) + int(quantity or 1)
                cart_item.save(update_fields=["quantity", "updated_at"])
            serializer = self.get_serializer(cart_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": "Could not add to cart", "error": str(exc)}, status=500)


class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    Allows authenticated customers to create a single review per product per completed order.
    List/retrieve are open for public consumption (product detail pages).
    """
    serializer_class = ProductReviewSerializer
    authentication_classes = [CustomerTokenAuthentication]
    permission_classes = [IsCustomerAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = ProductReview.objects.select_related("product", "customer", "order").order_by("-created_at")
        product_id = self.request.query_params.get("product_id")
        if product_id:
            qs = qs.filter(product_id=product_id)

        # Restrict mutation operations to the owner's reviews
        if self.action in ("update", "partial_update", "destroy"):
            return qs.filter(customer=getattr(self.request, "customer", None))

        mine = self.request.query_params.get("mine")
        if mine in ("true", "1") and getattr(self.request, "customer", None):
            qs = qs.filter(customer=self.request.customer)
        return qs

# ---------------- Checkout → create real api.Order ----------------

@api_view(["POST"])
def health(_):
    return Response({"ok": True}, status=200)

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def ping(_):
    return Response({"pong": True}, status=200)

@api_view(["POST"])
def _bad_request(_):
    return Response({"detail": "bad request"}, status=400)

@api_view(["POST"])
@permission_classes([])  # Auth handled manually for customer token
def checkout(request):
    """
    Body:
    {
      "payment_method": "cod" | "prepaid",
      "address_id": 123 (optional; if omitted, use default),
      "items": [ { "product_id": 1, "quantity": 2 }, ... ]  // optional; if omitted, use cart
    }
    Creates api.Order + api.OrderItem with computed totals.
    """
    from decimal import Decimal
    from .auth import CustomerTokenAuthentication
    from .serializers import StorefrontOrderSerializer

    auth = CustomerTokenAuthentication()
    auth_pair = auth.authenticate(request)
    if auth_pair is None:
        return Response({"detail": "Auth required"}, status=401)
    sf_customer = request.customer

    # Ensure the FK to api.Customer is populated (required field on Order)
    api_customer, created = Customer.objects.get_or_create(
        email=sf_customer.email,
        defaults={
            "name": sf_customer.name,
            "phone": sf_customer.phone or "",
        },
    )
    if not created:
        updated_fields = []
        if sf_customer.name and api_customer.name != sf_customer.name:
            api_customer.name = sf_customer.name
            updated_fields.append("name")
        if sf_customer.phone and api_customer.phone != sf_customer.phone:
            api_customer.phone = sf_customer.phone
            updated_fields.append("phone")
        if updated_fields:
            api_customer.save(update_fields=updated_fields)

    payload = request.data or {}
    pay_method_raw = payload.get("payment_method") or "cod"
    pay_method = str(pay_method_raw).lower() if isinstance(pay_method_raw, str) else "cod"
    if pay_method not in ("cod", "prepaid"):
        pay_method = "cod"

    address_id = payload.get("address_id")
    if address_id:
        try:
            addr = Address.objects.get(id=address_id, customer=sf_customer)
        except Address.DoesNotExist:
            return Response({"detail": "Invalid address"}, status=400)
    else:
        addr = Address.objects.filter(customer=sf_customer, is_default=True).first() or Address.objects.filter(customer=sf_customer).first()

    # Items: use provided list OR fall back to cart
    items = payload.get("items")
    if items and isinstance(items, list):
        # ad-hoc items
        cart_lines = []
        for it in items:
            try:
                p = Product.objects.get(id=it["product_id"])
                qty = int(it.get("quantity", 1))
                if qty <= 0:
                    continue
                cart_lines.append((p, qty))
            except Exception:
                continue
    else:
        # use full cart
        cart_qs = CartItem.objects.filter(customer=sf_customer).select_related("product")
        cart_lines = [(ci.product, ci.quantity) for ci in cart_qs]

    if not cart_lines:
        return Response({"detail": "No items to checkout"}, status=400)

    # Compute totals
    subtotal = Decimal("0")
    for p, qty in cart_lines:
        price = p.selling_price or p.mrp or 0
        subtotal += (Decimal(str(price)) * Decimal(str(qty)))

    # Charges: accept optional overrides from client (Total Payable flow). Fall back to 0.
    # We still compute a safe subtotal and guard against negative/underflow totals.
    def _parse_pct(val):
        if val in (None, ""):
            return Decimal("0")
        try:
            sval = str(val).replace("%", "").strip()
            return Decimal(sval)
        except Exception:
            return Decimal("0")

    raw_gst_percent = payload.get("gst_percent", None)
    gst_percent = _parse_pct(raw_gst_percent)
    delivery_charge = Decimal(str(payload.get("delivery_charge", "0") or "0"))
    client_total = payload.get("total")
    client_total_dec = None
    try:
        if client_total is not None:
            client_total_dec = Decimal(str(client_total))
    except Exception:
        client_total_dec = None

    # Compute GST amount from selling price and GST% (payload overrides product.gst)
    gst_amount = Decimal("0")
    for p, qty in cart_lines:
        line_total = Decimal(str(p.selling_price or p.mrp or 0)) * Decimal(str(qty))
        item_gst_percent = gst_percent
        # fallback to product.gst if provided and global gst_percent is 0
        if item_gst_percent in (None, "", Decimal("0")):
            item_gst_percent = _parse_pct(getattr(p, "gst", None))
        if item_gst_percent not in (None, "", Decimal("0")):
            gst_amount += (line_total * item_gst_percent) / Decimal("100")
            # If global gst_percent is empty, adopt the first non-zero item percent
            if gst_percent in (None, "", Decimal("0")) and item_gst_percent not in (None, "", Decimal("0")):
                gst_percent = item_gst_percent

    # If the client sent a total and GST is still zero, derive GST from the remaining delta after delivery.
    if client_total_dec is not None and gst_amount == 0:
        delta = client_total_dec - subtotal - delivery_charge
        if delta > 0:
            gst_amount = delta
            if subtotal > 0 and gst_percent in (None, "", Decimal("0")):
                gst_percent = (gst_amount / subtotal) * Decimal("100")

    order = Order.objects.create(
        customer=api_customer,
        total_amount=subtotal,  # will adjust below if gst/delivery needed
        status="pending",  # new orders start as pending until accepted in admin
        payment_method=pay_method,
        address_line1=getattr(addr, "line1", None) if addr else None,
        address_line2=getattr(addr, "line2", None) if addr else None,
        city=getattr(addr, "city", None) if addr else None,
        state=getattr(addr, "state", None) if addr else None,
        pincode=getattr(addr, "pincode", None) if addr else None,
        gst_percent=gst_percent,
        delivery_charge=delivery_charge,
    )

    for p, qty in cart_lines:
        safe_name = (getattr(p, "name", None) or getattr(p, "unique_code", None) or f"Product #{p.id}")
        safe_sku = getattr(p, "unique_code", None) or getattr(p, "sku", None)
        OrderItem.objects.create(
            order=order,
            product=p,
            name=safe_name,
            sku=safe_sku,
            price=p.selling_price or p.mrp or 0,
            quantity=qty,
        )

    # Re-total (your api serializer already re-totals; do it here too)
    computed_total = subtotal + gst_amount + delivery_charge

    # If client sent Total Payable, trust it when it is >= computed subtotal (to match what user saw)
    if client_total_dec is not None and client_total_dec >= subtotal:
        order.total_amount = client_total_dec
    else:
        order.total_amount = computed_total
    order.gst_percent = gst_percent
    order.delivery_charge = delivery_charge
    order.save()
    try:
        send_order_status_email(order)
    except Exception:
        pass

    # Clear cart (order placed). Removes all cart lines for this customer.
    CartItem.objects.filter(customer=sf_customer).delete()

    serialized = StorefrontOrderSerializer(order)
    return Response({"order": serialized.data}, status=201)


@api_view(["GET"])
@permission_classes([])  # Auth handled manually for customer token
def customer_orders(request):
    """
    Return orders for the authenticated storefront customer.
    """
    from .auth import CustomerTokenAuthentication
    from .serializers import StorefrontOrderSerializer

    auth = CustomerTokenAuthentication()
    auth_pair = auth.authenticate(request)
    if auth_pair is None:
        return Response({"detail": "Auth required"}, status=401)

    sf_customer = request.customer
    api_customer, _ = Customer.objects.get_or_create(
        email=sf_customer.email,
        defaults={
            "name": sf_customer.name,
            "phone": sf_customer.phone or "",
        },
    )
    qs = (
        Order.objects.filter(customer=api_customer)
        .prefetch_related("items")
        .order_by("-created_at")
    )
    data = StorefrontOrderSerializer(qs, many=True).data
    return Response(data, status=200)

class PublicBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /storefront/banners/
    Returns only currently active banners (within valid date range)
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = BannerSerializer

    def get_queryset(self):
        today = date.today()
        return Banner.objects.filter(
            Q(status="Active") &
            Q(start_date__lte=today) &
            (Q(end_date__isnull=True) | Q(end_date__gte=today))
        ).order_by('display_order', '-created_at')

