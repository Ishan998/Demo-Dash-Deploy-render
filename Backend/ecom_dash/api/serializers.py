from rest_framework import serializers
from .models import RichProductDescription
from rest_framework.request import Request
from .models import *
from .models import VisitorRegionData
from .models import Product
from .models import Order, Customer, OrderItem
from decimal import Decimal

from .models import MainCategory, SubCategory, Material, Color, Occasion, HomeCollageItem
from .utils.image_utils import convert_list_to_avif


class ProductVariantSerializer(serializers.ModelSerializer):
    # Accept incoming base64 strings (or URLs) and still allow absolute-URL output
    images = serializers.ListField(child=serializers.CharField(), required=False)
    sellingPrice = serializers.DecimalField(
        source='selling_price', max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    rpdId = serializers.PrimaryKeyRelatedField(source='rpd', queryset=RichProductDescription.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id", "name", "sku", "mrp", "sellingPrice", "stock", "images", "tags", "colors", "sizes", "rpdId"
        ]

    def to_internal_value(self, data):
        # Be lenient: accept both 'sellingPrice' and 'selling_price'
        try:
            if isinstance(data, dict):
                d = data.copy()
                if 'selling_price' in d and 'sellingPrice' not in d:
                    d['sellingPrice'] = d['selling_price']
                # Normalize empty strings to omission so DecimalField won't coerce to 0
                if d.get('sellingPrice') == "":
                    d.pop('sellingPrice')
                return super().to_internal_value(d)
        except Exception:
            pass
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        images = data.get("images") or []
        if request and images:
            data["images"] = [
                request.build_absolute_uri(img) if isinstance(img, str) and img.startswith("/") else img
                for img in images
            ]
        return data


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)
    # ✅ Make 'images' a writable field to accept incoming base64 data.
    # It will still be read back correctly by the 'to_representation' method.
    images = serializers.ListField(child=serializers.CharField(), required=False)

    # Aliases for frontend camelCase keys
    mainCategory = serializers.CharField(source='main_category', required=False, allow_null=True, allow_blank=True)
    subCategory = serializers.CharField(source='sub_category', required=False, allow_null=True, allow_blank=True)
    crystalName = serializers.CharField(source='crystal_name', required=False, allow_null=True, allow_blank=True)
    specifications = serializers.CharField(source='product_specification', required=False, allow_null=True, allow_blank=True)
    isReturnable = serializers.BooleanField(source='is_returnable', required=False)
    sku = serializers.CharField(source='unique_code', required=False, allow_blank=True)
    sellingPrice = serializers.DecimalField(source='selling_price', max_digits=10, decimal_places=2, required=False)
    deliveryInfo = serializers.SerializerMethodField()
    rpdId = serializers.SerializerMethodField()
    limitedDealEndsAt = serializers.DateTimeField(
        source='limited_deal_ends_at', required=False, allow_null=True
    )

    class Meta:
        model = Product
        fields = '__all__'

    def get_deliveryInfo(self, obj):
        return {
            "weight": obj.delivery_weight,
            "width": obj.delivery_width,
            "height": obj.delivery_height,
            "depth": obj.delivery_depth,
            "deliveryCharges": obj.delivery_charges,
            "returnCharges": obj.return_charges,
            "deliveryInDays": obj.delivery_days,
        }

    def get_rpdId(self, obj):
        link = RPDProductLink.objects.filter(product=obj).first()
        return link.rpd_id if link else None

    def to_representation(self, instance):
        """
        Modify the output representation.
        This is where we build absolute URLs for images.
        """
        representation = super().to_representation(instance)
        request = self.context.get("request")
        
        # Build absolute URLs for images if they exist
        if request and instance.images:
            # This logic was previously in get_images
            representation['images'] = [request.build_absolute_uri(img) for img in instance.images]
        # Keep camelCase for frontend consumers
        representation['limitedDealEndsAt'] = representation.get('limited_deal_ends_at')
        return representation

    def create(self, validated_data):
        variants_data = validated_data.pop("variants", [])
        if "images" in validated_data:
            validated_data["images"] = convert_list_to_avif(validated_data.get("images") or [])
        product = super().create(validated_data)

        # Link base product to RPD if provided
        rpd_id = self.initial_data.get('rpdId')
        if rpd_id:
            try:
                rpd_obj = RichProductDescription.objects.get(id=rpd_id)
                RPDProductLink.objects.update_or_create(product=product, defaults={"rpd": rpd_obj})
            except RichProductDescription.DoesNotExist:
                pass

        for variant in variants_data:
            images = variant.get("images") or []
            variant["images"] = convert_list_to_avif(images)
            ProductVariant.objects.create(product=product, **variant)
        return product

    # def update(self, instance, validated_data):

    #         variants_data = validated_data.pop("variants", [])
    #         product = super().update(instance, validated_data)

    #         existing_variants = {v.id: v for v in product.variants.all()}
    #         existing_by_sku = {v.sku: v for v in product.variants.all() if v.sku}

    #         for variant in variants_data:
    #             v_id = variant.get("id")
    #             v_sku = variant.get("sku")

    #             if v_id and v_id in existing_variants:
    #                 # Update by id
    #                 v_obj = existing_variants[v_id]
    #                 for attr, value in variant.items():
    #                     setattr(v_obj, attr, value)
    #                 v_obj.save()

    #             elif v_sku and v_sku in existing_by_sku:
    #                 # Update by SKU if id missing but sku matches
    #                 v_obj = existing_by_sku[v_sku]
    #                 for attr, value in variant.items():
    #                     setattr(v_obj, attr, value)
    #                 v_obj.save()

    #             else:
    #                 # New variant
    #                 ProductVariant.objects.create(product=product, **variant)

    #         return product
    def update(self, instance, validated_data):
        variants_data = validated_data.pop("variants", [])
        if "images" in validated_data:
            validated_data["images"] = convert_list_to_avif(validated_data.get("images") or [])
        product = super().update(instance, validated_data)

        # Update base product RPD link if provided
        rpd_id = self.initial_data.get('rpdId')
        if rpd_id is not None:
            try:
                rpd_obj = RichProductDescription.objects.get(id=rpd_id)
                RPDProductLink.objects.update_or_create(product=product, defaults={"rpd": rpd_obj})
            except RichProductDescription.DoesNotExist:
                # If invalid id provided, remove link
                RPDProductLink.objects.filter(product=product).delete()

        existing_variants = {v.id: v for v in product.variants.all()}
        existing_by_sku = {v.sku: v for v in product.variants.all() if v.sku}
        allowed_keys = {"name", "sku", "images", "tags", "colors", "sizes", "mrp", "selling_price", "stock", "rpd"}

        # 🧠 Fields that should NOT be copied from parent
        VARIANT_OVERRIDES = ["name", "sku", "images", "tags", "mrp", "selling_price", "stock"]

        # 🧠 Fields that CAN be inherited from parent
        parent_fields = {
            "description": product.description,
            "main_category": product.main_category,
            "sub_category": product.sub_category,
            "materials": product.materials,
            "colors": product.colors,
            "occasions": product.occasions,
            "sizes": getattr(product, "sizes", []),
            "gst": product.gst,
            "product_specification": product.product_specification,
            "is_returnable": product.is_returnable,
            "delivery_weight": product.delivery_weight,
            "delivery_width": product.delivery_width,
            "delivery_height": product.delivery_height,
            "delivery_depth": product.delivery_depth,
            "deliveryInDays": product.delivery_days,
            "deliveryCharges": product.delivery_charges,
            "returnCharges": product.return_charges,
            "crystal_name": product.crystal_name,
        }

        # Map initial raw variants by id/sku for fallback values (camelCase)
        initial_variants_raw = self.initial_data.get('variants') if isinstance(self.initial_data, dict) else []
        initial_by_id = {}
        initial_by_sku = {}
        try:
            for rv in (initial_variants_raw or []):
                if isinstance(rv, dict):
                    if rv.get('id') is not None:
                        initial_by_id[rv.get('id')] = rv
                    if rv.get('sku'):
                        initial_by_sku[rv.get('sku')] = rv
        except Exception:
            pass

        for variant in variants_data:
            v_id = variant.get("id")
            v_sku = variant.get("sku")

            # Normalize possible camelCase key from nested serializer
            vdict = dict(variant)
            if "sellingPrice" in vdict and "selling_price" not in vdict:
                vdict["selling_price"] = vdict.pop("sellingPrice")

            # Fallbacks: ensure selling_price is carried over from raw payload if needed
            raw = initial_by_id.get(v_id) or initial_by_sku.get(v_sku)
            if "selling_price" not in vdict:
                if isinstance(raw, dict) and raw.get("sellingPrice") not in (None, ""):
                    vdict["selling_price"] = raw.get("sellingPrice")
            else:
                # If serializer dropped or zeroed value unexpectedly, prefer explicit raw sellingPrice
                try:
                    current_val = vdict.get("selling_price")
                    # Treat empty-string as missing
                    if current_val in ("", None):
                        raise ValueError("missing")
                    # If number-like 0 while raw has a non-zero numeric, use raw
                    if (str(current_val) in ("0", "0.0", "0.00", "0.000") or current_val == 0) and isinstance(raw, dict):
                        rp = raw.get("sellingPrice")
                        if rp not in (None, "", 0, "0", "0.0", "0.00", "0.000"):
                            vdict["selling_price"] = rp
                except Exception:
                    if isinstance(raw, dict) and raw.get("sellingPrice") not in (None, ""):
                        vdict["selling_price"] = raw.get("sellingPrice")

            # Only keep fields belonging to ProductVariant
            cleaned = {k: v for k, v in vdict.items() if k in allowed_keys}
            if "images" in cleaned:
                cleaned["images"] = convert_list_to_avif(cleaned.get("images") or [])

            if v_id and v_id in existing_variants:
                v_obj = existing_variants[v_id]
                for attr, value in cleaned.items():
                    setattr(v_obj, attr, value)
                v_obj.save()

            elif v_sku and v_sku in existing_by_sku:
                v_obj = existing_by_sku[v_sku]
                for attr, value in cleaned.items():
                    setattr(v_obj, attr, value)
                v_obj.save()

            else:
                ProductVariant.objects.create(product=product, **cleaned)

        # Ensure fresh related data for representation
        try:
            product.refresh_from_db()
            # Clear any prefetch cache if present
            if hasattr(product, "_prefetched_objects_cache"):
                product._prefetched_objects_cache.pop("variants", None)
        except Exception:
            pass

        return product



class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(read_only=True)
    total_spend = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'status', 'created_at', 'total_orders', 'total_spend']

class CustomerAccountSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(read_only=True)
    total_spend = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        from storefront.models import CustomerAccount
        model = CustomerAccount
        fields = ["id", "name", "email", "phone", "is_active", "created_at", "updated_at", "total_orders", "total_spend"]

    def update(self, instance, validated_data):
        # Support status payload for backward compatibility (active/blocked)
        status_val = self.initial_data.get("status")
        if status_val is not None and "is_active" not in validated_data:
            validated_data["is_active"] = str(status_val).lower() == "active"
        return super().update(instance, validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
        allow_null=True
    )
    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'sku', 'price', 'quantity', 'product']

    def to_representation(self, instance):
        """
        Ensure a usable name is always surfaced to the admin UI even if the
        stored snapshot is empty.
        """
        data = super().to_representation(instance)
        if not data.get("name"):
            fallback = getattr(instance.product, "name", None) or data.get("sku") or "Product"
            data["name"] = fallback
        if not data.get("sku"):
            data["sku"] = getattr(instance.product, "unique_code", None) or data.get("sku")
        return data

class OrderWithItemsSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(required=False)
    # Make total_amount server-controlled
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    # Be lenient with incoming charge fields
    gst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    delivery_charge = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    items = OrderItemSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'total_amount', 'status',
            'payment_method', 'address_line1', 'address_line2',
            'city', 'state', 'pincode',
            'gst_percent', 'delivery_charge',
            'created_at', 'items'
        ]

    def to_internal_value(self, data):
        # Coerce empty strings to None for Decimal fields to avoid 400 errors
        if isinstance(data, dict):
            data = data.copy()
        for key in ('gst_percent', 'delivery_charge'):
            if data.get(key) == "":
                data[key] = None
        # Handle blank address gracefully
        for key in ('address_line1', 'address_line2', 'city', 'state', 'pincode'):
            if key in data and data[key] == "":
                data[key] = None
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['status'] = instance.status.lower()
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        customer_data = validated_data.pop('customer')
        # Pull charges from payload (defaults to 0 if omitted)
        gst_percent = validated_data.pop('gst_percent', 0) or 0
        delivery_charge = validated_data.pop('delivery_charge', 0) or 0
        # Ignore client-provided total_amount when items are present
        client_total = validated_data.pop('total_amount', 0)

        customer, _ = Customer.objects.get_or_create(
            email=customer_data['email'],
            defaults={'name': customer_data['name'], 'phone': customer_data['phone']}
        )
        # Start with total 0; compute from items if provided
        order = Order.objects.create(
            customer=customer,
            total_amount=0,
            gst_percent=gst_percent,
            delivery_charge=delivery_charge,
            **validated_data,
        )

        # Compute subtotal ignoring synthetic charge items if sent as items
        subtotal = Decimal('0')
        gst_from_items = Decimal('0')
        delivery_from_items = Decimal('0')
        for item in items_data:
            name = (item.get('name') or '').strip().lower()
            price_val = item.get('price', 0)
            qty_val = item.get('quantity', 0)
            # Normalize decimals
            price_dec = price_val if isinstance(price_val, Decimal) else Decimal(str(price_val))
            qty_dec = qty_val if isinstance(qty_val, Decimal) else Decimal(str(qty_val))

            if name in ('gst', 'delivery charge', 'delivery'):
                if name == 'gst':
                    gst_from_items += price_dec
                else:
                    delivery_from_items += price_dec
                continue
            OrderItem.objects.create(order=order, **item)
            subtotal += (price_dec * qty_dec)

        # Determine charges
        # Normalize incoming gst_percent and delivery_charge to Decimal
        gst_pct_dec = gst_percent if isinstance(gst_percent, Decimal) else Decimal(str(gst_percent))
        del_charge_dec = delivery_charge if isinstance(delivery_charge, Decimal) else Decimal(str(delivery_charge))

        if (gst_pct_dec is None or gst_pct_dec == Decimal('0')) and subtotal > 0 and gst_from_items > 0:
            # Derive percentage from provided GST item amount
            gst_pct_dec = (gst_from_items / subtotal) * Decimal('100')

        if (del_charge_dec is None or del_charge_dec == Decimal('0')) and delivery_from_items > 0:
            del_charge_dec = delivery_from_items

        # Calculate totals with Decimal math
        gst_amount = (subtotal * gst_pct_dec) / Decimal('100') if subtotal > 0 else Decimal('0')
        order.gst_percent = gst_pct_dec
        order.delivery_charge = del_charge_dec
        order.total_amount = subtotal + gst_amount + del_charge_dec
        order.save()
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        customer_data = validated_data.pop('customer', None)
        gst_percent = validated_data.pop('gst_percent', None)
        delivery_charge = validated_data.pop('delivery_charge', None)

        if customer_data:
            customer, _ = Customer.objects.get_or_create(
                email=customer_data['email'],
                defaults={'name': customer_data['name'], 'phone': customer_data['phone']}
            )
            instance.customer = customer

        for field in ['status', 'payment_method', 'address_line1', 'address_line2', 'city', 'state', 'pincode']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        if gst_percent is not None:
            instance.gst_percent = gst_percent
        if delivery_charge is not None:
            instance.delivery_charge = delivery_charge
        instance.save()

        recompute = (items_data is not None) or (gst_percent is not None) or (delivery_charge is not None)
        if items_data is not None:
            instance.items.all().delete()
            subtotal = Decimal('0')
            gst_from_items = Decimal('0')
            delivery_from_items = Decimal('0')
            for item in items_data:
                name = (item.get('name') or '').strip().lower()
                price_val = item.get('price', 0)
                qty_val = item.get('quantity', 0)
                price_dec = price_val if isinstance(price_val, Decimal) else Decimal(str(price_val))
                qty_dec = qty_val if isinstance(qty_val, Decimal) else Decimal(str(qty_val))

                if name in ('gst', 'delivery charge', 'delivery'):
                    if name == 'gst':
                        gst_from_items += price_dec
                    else:
                        delivery_from_items += price_dec
                    continue
                OrderItem.objects.create(order=instance, **item)
                subtotal += (price_dec * qty_dec)

            # If gst_percent not explicitly provided but GST item exists, derive
            if gst_percent is None and subtotal > 0 and gst_from_items > 0:
                instance.gst_percent = (gst_from_items / subtotal) * Decimal('100')
            # If delivery not explicitly provided, take from items
            if delivery_charge is None and delivery_from_items > 0:
                instance.delivery_charge = delivery_from_items
        else:
            # Recompute subtotal from existing items if only charges changed
            if recompute:
                subtotal = sum([(i.price * i.quantity) for i in instance.items.all()], Decimal('0'))

        if recompute:
            gst_amount = (subtotal * (instance.gst_percent if isinstance(instance.gst_percent, Decimal) else Decimal(str(instance.gst_percent)))) / Decimal('100') if subtotal > 0 else Decimal('0')
            del_charge_dec = instance.delivery_charge if isinstance(instance.delivery_charge, Decimal) else Decimal(str(instance.delivery_charge or 0))
            instance.total_amount = subtotal + gst_amount + del_charge_dec
            instance.save()
        return instance
    
class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()   # ✅ nested allowed

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'total_amount', 'status',
            'payment_method', 'address_line1', 'address_line2',
            'city', 'state', 'pincode', 'created_at'
        ]
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['status'] = instance.status.lower()
        return data

    def create(self, validated_data):
        customer_data = validated_data.pop('customer')
        # check if customer exists by email
        customer, _ = Customer.objects.get_or_create(
            email=customer_data['email'],
            defaults={'name': customer_data['name'], 'phone': customer_data['phone']}
        )
        order = Order.objects.create(customer=customer, **validated_data)
        return order


class DiscountSerializer(serializers.ModelSerializer):
    appliesTo = serializers.SerializerMethodField()

    class Meta:
        model = Discount
        fields = '__all__'

    def get_appliesTo(self, obj):
        data = { 'type': getattr(obj, 'applies_to_type', 'all_products') }
        if data['type'] == 'specific_products':
            data['productIds'] = list(obj.applies_to_products.values_list('id', flat=True))
        else:
            data['productIds'] = []
        return data

    def _apply_applies_to(self, instance, applies):
        """Apply incoming applies-to payload to model fields.

        Supports both camelCase (appliesTo.productIds) and snake_case
        (applies_to.product_ids) payloads due to the djangorestframework-camel-case
        parser converting keys.
        """
        # Safety: ensure dict
        applies = applies or {}
        if not isinstance(applies, dict):
            applies = {}

        # Read type regardless of casing
        type_ = applies.get('type') or 'all_products'
        if type_ not in ('all_products', 'specific_products'):
            type_ = 'all_products'
        instance.applies_to_type = type_
        instance.save()
        if type_ == 'specific_products':
            # Accept both productIds and product_ids
            ids = applies.get('productIds')
            if ids is None:
                ids = applies.get('product_ids')
            try:
                from .models import Product
                instance.applies_to_products.set(Product.objects.filter(id__in=(ids or [])))
            except Exception:
                instance.applies_to_products.clear()
        else:
            instance.applies_to_products.clear()

    def create(self, validated_data):
        # Read appliesTo from initial data, tolerant to camel/snake case
        applies = None
        try:
            raw = self.initial_data or {}
            applies = raw.get('appliesTo')
            if applies is None:
                applies = raw.get('applies_to')
        except Exception:
            applies = None
        instance = super().create(validated_data)
        self._apply_applies_to(instance, applies)
        return instance

    def update(self, instance, validated_data):
        # Read appliesTo from initial data, tolerant to camel/snake case
        applies = None
        try:
            raw = self.initial_data or {}
            applies = raw.get('appliesTo')
            if applies is None:
                applies = raw.get('applies_to')
        except Exception:
            applies = None
        instance = super().update(instance, validated_data)
        if applies is not None:
            self._apply_applies_to(instance, applies)
        return instance

# class BannerSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Banner
#         fields = ['id', 'title', 'image', 'start_date', 'end_date', 'status', 'created_at', 'updated_at']
class BannerSerializer(serializers.ModelSerializer):
    # Use an ImageField so uploads are accepted; format the response to an absolute URL in to_representation.
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Banner
        fields = [
            'id', 'title', 'image', 'redirect_url', 'display_order',
            'device_type', 'start_date', 'end_date', 'status',
            'created_at', 'updated_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        image = data.get("image")
        if image and request and not str(image).startswith("http"):
            data["image"] = request.build_absolute_uri(image)
        return data
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'content', 'created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "is_read", "type", "created_at"]

class RPDSerializer(serializers.ModelSerializer):
    class Meta:
        model = RPD
        fields = '__all__'



class RichProductDescriptionSerializer(serializers.ModelSerializer):
    products = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Product.objects.all()   # ✅ ensures IDs are valid products
    )

    class Meta:
        model = RichProductDescription
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_products(self, products):
        current_instance = getattr(self, 'instance', None)
        for product in products:
            links = RPDProductLink.objects.filter(product=product)
            if current_instance is not None:
                links = links.exclude(rpd=current_instance)
            if links.exists():
                raise serializers.ValidationError(
                    f"Product '{product.name}' is already linked to another RPD."
                )
        return products





class VisitorRegionDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorRegionData
        fields = '__all__'



class MainCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MainCategory
        fields = '__all__'

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = '__all__'

class OccasionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Occasion
        fields = '__all__'

class HomeCollageItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = HomeCollageItem
        fields = [
            "id",
            "name",
            "item_type",
            "image",
            "image_url",
            "imageUrl",
            "grid_class",
            "display_order",
            "redirect_url",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "image_url": {"required": False, "allow_blank": True, "allow_null": True},
            "grid_class": {"required": False, "allow_blank": True},
            "redirect_url": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def get_imageUrl(self, obj):
        request = self.context.get("request")
        url = obj.resolved_image
        if url and request and not str(url).startswith("http"):
            return request.build_absolute_uri(url)
        return url

    def validate(self, attrs):
        image = attrs.get("image")
        image_url = attrs.get("image_url")
        instance = getattr(self, "instance", None)
        if not image and not image_url:
            if not instance or (not getattr(instance, "image", None) and not getattr(instance, "image_url", None)):
                raise serializers.ValidationError("Provide an image upload or an image_url for the collage tile.")
        return attrs

class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "user", "user_email", "message", "type", "timestamp"]
