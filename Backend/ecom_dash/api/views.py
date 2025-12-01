from django.shortcuts import render
from django.shortcuts import HttpResponse
import json
# Create your views here.
from rest_framework import viewsets, permissions
from .models import RichProductDescription
from .serializers import RichProductDescriptionSerializer
from .models import *
from .serializers import *
from .models import VisitorRegionData
from .serializers import VisitorRegionDataSerializer
# views.py
# from rest_framework import viewsets
from .models import MainCategory, SubCategory, Material, Color, Occasion
from .serializers import (
    MainCategorySerializer, SubCategorySerializer,
    MaterialSerializer, ColorSerializer, OccasionSerializer
)
from .serializers import CustomerAccountSerializer
from rest_framework.response import Response 
from rest_framework import status

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.db.models import Count, Sum, DecimalField, OuterRef, Subquery, IntegerField, Max
from django.db.models.functions import Coalesce
from .models import Order
from .serializers import OrderWithItemsSerializer
from .models import VisitorRegionData
from .serializers import VisitorRegionDataSerializer
from analytic.models import Visitor
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone
import os
import shutil
from pathlib import Path
from django.db import connections
from .models import Banner
from .serializers import BannerSerializer
from django.db.models import Q
from datetime import date
from api.utils.email_utils import send_order_status_email


class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

class CustomerViewSet(BaseViewSet):
    queryset = Customer.objects.annotate(
        total_orders=Count('orders'),
        total_spend=Coalesce(
            Sum('orders__total_amount'),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2)
        )
    )
    serializer_class = CustomerSerializer

    # queryset = Customer.objects.all()
    # serializer_class = CustomerSerializer


class CustomerAccountViewSet(BaseViewSet):
    """
    Manage storefront customer accounts (signup accounts).
    Supports list/update/delete/block (is_active field).
    """
    from storefront.models import CustomerAccount
    from api.models import Order
    from api.models import Customer as ApiCustomer
    queryset = CustomerAccount.objects.all().order_by("-created_at")
    serializer_class = CustomerAccountSerializer

    def get_queryset(self):
        # Annotate total orders/spend for storefront customers by mapping to api.Customer via email (case-insensitive)
        qs = super().get_queryset()
        orders_for_email = (
            Order.objects
            .filter(customer__email__iexact=OuterRef("email"))
            .values("customer__email")
        )
        orders_count = orders_for_email.annotate(cnt=Count("id")).values("cnt")[:1]
        orders_sum = orders_for_email.annotate(sum_amt=Sum("total_amount")).values("sum_amt")[:1]

        return qs.annotate(
            total_orders=Coalesce(Subquery(orders_count), 0, output_field=IntegerField()),
            total_spend=Coalesce(Subquery(orders_sum), 0, output_field=DecimalField(max_digits=12, decimal_places=2)),
        )



class ProductViewSet(BaseViewSet):
    queryset = Product.objects.all().prefetch_related("variants")
    serializer_class = ProductSerializer
    def _normalize_payload(self, data):
        """Flattens deliveryInfo, maps camelCase to snake_case."""
        # Handle nested deliveryInfo (string or dict)
        delivery_info = data.get("deliveryInfo") or data.get("delivery_info")
        if delivery_info:
            # print(delivery_info)
            if isinstance(delivery_info, str):
                try:
                    delivery_info = json.loads(delivery_info)
                    print(delivery_info)
                except json.JSONDecodeError:
                    delivery_info = {}
            if isinstance(delivery_info, dict):
                data["delivery_weight"] = delivery_info.get("weight")
                data["delivery_width"] = delivery_info.get("width")
                data["delivery_height"] = delivery_info.get("height")
                data["delivery_depth"] = delivery_info.get("depth")
                # Accept both camelCase and snake_case keys
                _dc = delivery_info.get("deliveryCharges")
                if _dc is None or _dc == "":
                    _dc = delivery_info.get("delivery_charges")
                data["delivery_charges"] = _dc

                _rc = delivery_info.get("returnCharges")
                if _rc is None or _rc == "":
                    _rc = delivery_info.get("return_charges")
                data["return_charges"] = _rc

                _dd = delivery_info.get("deliveryInDays")
                if _dd is None or _dd == "":
                    _dd = delivery_info.get("delivery_in_days")
                data["delivery_days"] = _dd
                # Remove read-only nested field from payload to avoid serializer errors
                if "deliveryInfo" in data:
                    data.pop("deliveryInfo", None)
                if "delivery_info" in data:
                    data.pop("delivery_info", None)

        # Rename frontend keys → model fields
        if "specifications" in data:
            data["product_specification"] = data.pop("specifications")
        if "crystalName" in data:
            data["crystal_name"] = data.pop("crystalName")
        if "sku" in data:
            data["unique_code"] = data.pop("sku")
        if "isReturnable" in data:
            data["is_returnable"] = data.pop("isReturnable")
        if "mainCategory" in data:
            data["main_category"] = data.pop("mainCategory")
        if "subCategory" in data:
            data["sub_category"] = data.pop("subCategory")
        if "sellingPrice" in data:
            data["selling_price"] = data.pop("sellingPrice")
        if "limitedDealEndsAt" in data:
            data["limited_deal_ends_at"] = data.pop("limitedDealEndsAt") or None
        if "limited_deal_ends_at" in data and data["limited_deal_ends_at"] == "":
            data["limited_deal_ends_at"] = None

        if "variants" in data and isinstance(data["variants"], list):
            for variant in data["variants"]:
                if isinstance(variant, dict):
                    if "mrp" in variant and variant["mrp"] in ("", None):
                        variant["mrp"] = 0
                    if "stock" in variant and variant["stock"] in ("", None):
                        variant["stock"] = 0

        # Do NOT rewrite nested variant keys; nested serializer expects camelCase (e.g., "sellingPrice")

        # Normalize status
        status_map = {
            "In Stock": "in_stock",
            "Out of Stock": "out_of_stock",
            "Discontinued": "discontinued",
        }
        if "status" in data and data["status"] in status_map:
            data["status"] = status_map[data["status"]]

        return data


    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data = self._normalize_payload(data)

        # print("\n📦 PRODUCT CREATE PAYLOAD (NORMALIZED):", type(data))
        # print("\n🔍 NORMALIZED PAYLOAD (FINAL):", json.dumps(data, indent=2))

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            # print("\n❌ PRODUCT CREATION ERROR:\n", serializer.errors, "\n")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        # print("\n✅ PRODUCT CREATED SUCCESSFULLY!\n")
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        data1 = request.data.copy()
        data = self._normalize_payload(data1)

        # print("\n🛠 PRODUCT UPDATE PAYLOAD (NORMALIZED):", type(data))
        # print("\n🔍 NORMALIZED PAYLOAD (FINAL):", json.dumps(data, indent=2))
        # print(data.values())
        # print(data.keys())
        for key,values in data.items():
            if key == 'images':
                pass
            # elif key=='delivery_info':
            #     print(values)
            #     print(type(values))
            # else:
                # print(f"{key} : {values}")

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=True)
        if not serializer.is_valid():
            # print("\n❌ PRODUCT UPDATE ERROR:\n", serializer.errors, "\n")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # print(type(serializer))


        serializer.save()
        # print("\n✅ PRODUCT UPDATED SUCCESSFULLY!\n")
        # print("\n🧠 Serializer initial data:", serializer.initial_data)
        # print("🧠 \n Serializer validated data:", serializer.validated_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"], url_path="public")
    def public_products(self, request):
        """Returns parent + variants flattened for storefront."""
        queryset = self.get_queryset()
        results = []
        for product in queryset:
            if product.variants.exists():
                for v in product.variants.all():
                    merged = {
                        "id": v.id,
                        "name": f"{product.name} - {v.name}",
                        "sku": v.sku,
                        "price": v.selling_price,
                        "mrp": v.mrp,
                        "stock": v.stock,
                        "images": v.images or product.images,
                        "tags": v.tags or product.tags,
                        "description": product.description,
                        "category": product.main_category,
                        "gst": product.gst,
                        "isReturnable": product.is_returnable,
                    }
                    results.append(merged)
            else:
                results.append({
                    "id": product.id,
                    "name": product.name,
                    "sku": product.unique_code,
                    "price": product.selling_price,
                    "mrp": product.mrp,
                    "stock": product.stock,
                    "images": product.images,
                    "tags": product.tags,
                    "description": product.description,
                    "category": product.main_category,
                    "gst": product.gst,
                    "isReturnable": product.is_returnable,
                })
        return Response(results)




class OrderViewSet(BaseViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderWithItemsSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        try:
            send_order_status_email(serializer.instance)
        except Exception:
            pass
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        previous_status = getattr(instance, "status", None)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        updated_order = serializer.instance

        try:
            new_status = getattr(updated_order, "status", None)
            if new_status and new_status != previous_status:
                send_order_status_email(updated_order)
        except Exception:
            pass

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        if not new_status:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)

        previous_status = order.status
        order.status = new_status
        order.save()
        try:
            if new_status != previous_status:
                send_order_status_email(order)
        except Exception:
            pass
        # Return full order with items/addresses so admin UI has data for invoice generation
        try:
            from .serializers import OrderWithItemsSerializer
            serialized = OrderWithItemsSerializer(order).data
        except Exception:
            serialized = OrderSerializer(order).data
        return Response(serialized, status=status.HTTP_200_OK)

class DiscountViewSet(BaseViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer

# class BannerViewSet(viewsets.ModelViewSet):
#     queryset = Banner.objects.all().order_by('-created_at')
#     serializer_class = BannerSerializer
class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by('display_order', '-created_at')
    serializer_class = BannerSerializer

    def get_queryset(self):
        """Return all banners by default; optionally filter active ones for preview."""
        qs = Banner.objects.all().order_by('display_order', '-created_at')
        # Do not filter for detail routes (retrieve/update/delete) so admin actions work
        if getattr(self, "action", None) != "list":
            return qs

        # Opt-in active filter for preview: /banners/?active_only=true
        active_only = self.request.query_params.get("active_only")
        show_all = self.request.query_params.get("all")
        if show_all == "true" or active_only not in ("true", "1", "yes"):
            return qs

        today = date.today()
        return qs.filter(
            Q(status="Active") &
            Q(start_date__lte=today) &
            (Q(end_date__isnull=True) | Q(end_date__gte=today))
        )

class HomeCollageItemViewSet(BaseViewSet):
    queryset = HomeCollageItem.objects.all().order_by("display_order", "name", "id")
    serializer_class = HomeCollageItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        item_type = self.request.query_params.get("type")
        if item_type in ("occasion", "crystal"):
            qs = qs.filter(item_type=item_type)
        return qs
    
    def _sync_occasion(self, item: HomeCollageItem):
        """
        Ensure an Occasion record exists for collage items of type 'occasion'.
        """
        if getattr(item, "item_type", None) != "occasion":
            return
        name = (getattr(item, "name", "") or "").strip()
        if not name:
            return
        existing = Occasion.objects.filter(name__iexact=name).first()
        if not existing:
            try:
                Occasion.objects.create(name=name)
            except Exception:
                pass

    def perform_create(self, serializer):
        item = serializer.save()
        self._sync_occasion(item)

    def perform_update(self, serializer):
        item = serializer.save()
        self._sync_occasion(item)
    
class NoteViewSet(BaseViewSet):
    # queryset = Note.objects.all()
    serializer_class = NoteSerializer

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationViewSet(BaseViewSet):
    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.queryset.update(is_read=True)
        return Response({"status": "all marked as read"}, status=status.HTTP_200_OK)

class RPDViewSet(BaseViewSet):
    queryset = RPD.objects.all()
    serializer_class = RPDSerializer

class RichProductDescriptionViewSet(viewsets.ModelViewSet):
    queryset = RichProductDescription.objects.all()  
    serializer_class = RichProductDescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RichProductDescription.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # print("❌ Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    
def _sync_visitor_region_table():
    """
    Aggregate unique visitors by region from the Visitor table and
    persist the latest counts into VisitorRegionData to keep the
    admin dashboard API consistent.
    """
    region_stats = (
        Visitor.objects.values("region")
        .annotate(
            visitors=Count("ip_address", distinct=True),
            last_seen=Max("timestamp"),
        )
    )
    active_regions = set()
    now = timezone.now()

    for stat in region_stats:
        region_name = stat.get("region") or "Unknown"
        active_regions.add(region_name)
        obj, _ = VisitorRegionData.objects.get_or_create(region=region_name)
        obj.visitors = stat.get("visitors") or 0
        obj.last_updated = stat.get("last_seen") or now
        obj.save(update_fields=["visitors", "last_updated"])

    if active_regions:
        VisitorRegionData.objects.exclude(region__in=active_regions).delete()
        return VisitorRegionData.objects.filter(region__in=active_regions).order_by("-visitors")

    VisitorRegionData.objects.all().delete()
    return VisitorRegionData.objects.none()


class VisitorRegionDataViewSet(viewsets.ModelViewSet):
    queryset = VisitorRegionData.objects.all()
    serializer_class = VisitorRegionDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        synced_qs = _sync_visitor_region_table()
        serializer = self.get_serializer(synced_qs, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # public endpoint
def record_visitor(request):
    ip = request.META.get('REMOTE_ADDR') or ""
    user_agent = request.META.get("HTTP_USER_AGENT", "")
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        ip = forwarded.split(',')[0].strip() or ip

    # Best-effort region lookup; fall back to provided region or Unknown
    region_name = (request.data or {}).get("region") or "Unknown"
    try:
        if ip:
            res = requests.get(f"http://ip-api.com/json/{ip}?fields=country,regionName,city,status", timeout=3)
            data = res.json()
            if data.get("status") == "success":
                region_name = f"{data.get('regionName', 'Unknown')} ({data.get('country', '')})".strip()
    except Exception:
        pass

    if not region_name:
        region_name = "Unknown"

    # Avoid double-counting the same visitor repeatedly
    today = timezone.localdate()
    existing_visit = Visitor.objects.filter(ip_address=ip, timestamp__date=today).first()
    if existing_visit:
        if not existing_visit.region and region_name:
            existing_visit.region = region_name
            existing_visit.save(update_fields=["region"])
    else:
        Visitor.objects.create(
            ip_address=ip or "unknown",
            user_agent=user_agent,
            region=region_name,
        )

    synced_qs = _sync_visitor_region_table()
    serializer = VisitorRegionDataSerializer(synced_qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def backup_database(request):
    try:
        db_path = settings.DATABASES.get('default', {}).get('NAME')
        if not db_path:
            return Response({"error": "Database path not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        db_path = str(db_path)
        if not os.path.isfile(db_path):
            return Response({"error": f"Database file not found at {db_path}"}, status=status.HTTP_404_NOT_FOUND)

        backups_dir = Path(settings.MEDIA_ROOT) / 'backups'
        backups_dir.mkdir(parents=True, exist_ok=True)

        timestamp = timezone.now().strftime('%Y%m%d-%H%M%S')
        backup_filename = f"db-backup-{timestamp}.sqlite3"
        backup_path = backups_dir / backup_filename

        # Ensure any DB connections are idle; for SQLite, a simple copy generally works when no writes in-flight
        shutil.copy2(db_path, backup_path)

        backup_url = f"{settings.MEDIA_URL}backups/{backup_filename}"
        return Response({
            "message": "Backup created successfully",
            "backupPath": str(backup_path),
            "backupUrl": backup_url,
            "filename": backup_filename,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        # print("Database backup error:", e)
        return Response({"error": "Failed to create database backup"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_backups(request):
    try:
        backups_dir = Path(settings.MEDIA_ROOT) / 'backups'
        backups_dir.mkdir(parents=True, exist_ok=True)
        items = []
        for p in sorted(backups_dir.glob('db-backup-*.sqlite3')):
            stat = p.stat()
            items.append({
                'filename': p.name,
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime, tz=dt_timezone.utc).isoformat(),
                'url': f"{settings.MEDIA_URL}backups/{p.name}",
            })
        return Response(items, status=status.HTTP_200_OK)
    except Exception as e:
        # print("List backups error:", e)
        return Response({"error": "Failed to list backups"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def restore_database(request):
    try:
        filename = request.data.get('filename')
        if not filename or not isinstance(filename, str):
            return Response({"error": "'filename' is required"}, status=status.HTTP_400_BAD_REQUEST)
        # prevent path traversal
        if '/' in filename or '\\' in filename:
            return Response({"error": "Invalid filename"}, status=status.HTTP_400_BAD_REQUEST)

        db_path = settings.DATABASES.get('default', {}).get('NAME')
        if not db_path:
            return Response({"error": "Database path not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        db_path = Path(str(db_path))

        backups_dir = Path(settings.MEDIA_ROOT) / 'backups'
        backup_file = backups_dir / filename
        if not backup_file.is_file():
            return Response({"error": "Backup file not found"}, status=status.HTTP_404_NOT_FOUND)

        # Optional: take a safety backup before restoring
        safety_name = f"pre-restore-{timezone.now().strftime('%Y%m%d-%H%M%S')}.sqlite3"
        safety_path = backups_dir / safety_name

        # Close all DB connections to allow replacing sqlite file
        for alias in connections:
            try:
                connections[alias].close()
            except Exception:
                pass

        # Copy current DB to safety, then replace
        if db_path.exists():
            shutil.copy2(db_path, safety_path)
        shutil.copy2(backup_file, db_path)

        return Response({
            "message": "Database restored successfully",
            "restoredFrom": filename,
            "safetyBackup": safety_name,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        # print("Restore database error:", e)
        return Response({"error": "Failed to restore database"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MainCategoryViewSet(viewsets.ModelViewSet):
    queryset = MainCategory.objects.all()
    serializer_class = MainCategorySerializer

class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer

class OccasionViewSet(viewsets.ModelViewSet):
    queryset = Occasion.objects.all()
    serializer_class = OccasionSerializer

    def _sync_collage_occasions(self):
        """
        Ensure occasions from homepage collage tiles exist in the Occasion table.
        Case-insensitive matching to avoid duplicates.
        """
        names = (
            HomeCollageItem.objects.filter(item_type="occasion")
            .exclude(name__isnull=True)
            .exclude(name__exact="")
            .values_list("name", flat=True)
        )
        for name in names:
            existing = Occasion.objects.filter(name__iexact=name).first()
            if not existing:
                try:
                    Occasion.objects.create(name=name)
                except Exception:
                    # Ignore race conditions/validation errors
                    pass

    def get_queryset(self):
        try:
            self._sync_collage_occasions()
        except Exception:
            # Do not block listing if sync fails
            pass
        return super().get_queryset()


class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all().order_by("-timestamp")
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]  # or AllowAny if you don’t want auth

    def perform_create(self, serializer):
        serializer.save(user=self.request.user if self.request.user.is_authenticated else None)
