from django.shortcuts import render

# Create your views here.
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Count, Avg, Max
from django.db.models.functions import TruncDate, TruncHour
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Visitor
from api.models import Order
from rest_framework import status
from api.models import Product
from storefront.models import WishlistItem, CartItem, ProductReview
from django.http import HttpResponse
from io import BytesIO

@api_view(['POST'])
def log_visitor(request):
    """
    Logs a visitor's IP address and user agent.
    """
    ip_address = request.META.get('REMOTE_ADDR')
    user_agent = request.META.get('HTTP_USER_AGENT')

    # In a real application, you would use a geolocation API to determine the region.
    # For now, we'll use a placeholder.
    region = "Unknown"

    Visitor.objects.create(
        ip_address=ip_address,
        user_agent=user_agent,
        region=region,
    )

    return Response(status=status.HTTP_201_CREATED)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """Return summarized analytics data for the dashboard"""

    # Sync with API orders: use total_amount and created_at; treat non-cancelled as revenue
    total_revenue = (
        Order.objects.exclude(status__iexact='cancelled')
        .aggregate(Sum('total_amount'))
        .get('total_amount__sum')
        or 0
    )
    total_orders = Order.objects.exclude(status__iexact='cancelled').count()
    total_wishlist = WishlistItem.objects.count()
    total_cart = CartItem.objects.count()

    data = {
        "revenue": total_revenue,
        "orders": total_orders,
        "wishlisted": total_wishlist,
        "in_cart": total_cart,     # TODO: Replace with your model data
        "period_data": [
            # Optional: data points for charts (by day/week/month)
        ]
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wishlist_cart_timeseries(request):
    """
    Returns wishlist and cart counts grouped by a period matching the frontend buckets:
    - Yearly: 12 months (labels: Jan, Feb, ...)
    - Monthly: current month days (labels: '1', '2', ...)
    - Weekly: last 7 days (labels: Sun..Sat as date order from 6 days ago to today)
    - Daily: 24 hours for current day (labels: '00:00'..'23:00')
    """
    period = request.query_params.get("period", "Monthly")

    now = timezone.now()
    tz = timezone.get_current_timezone()

    def start_of_day(dt):
        return dt.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0)

    data = []

    total_wishlisted = 0
    total_in_cart = 0
    total_orders = 0
    total_revenue = 0.0

    if period == "Yearly":
        # 12 months in current year
        year = now.year
        for month in range(1, 13):
            start = timezone.make_aware(datetime(year, month, 1), tz)
            if month == 12:
                end = timezone.make_aware(datetime(year + 1, 1, 1), tz)
            else:
                end = timezone.make_aware(datetime(year, month + 1, 1), tz)
            label = start.strftime("%b")
            w = WishlistItem.objects.filter(created_at__gte=start, created_at__lt=end).count()
            c = CartItem.objects.filter(created_at__gte=start, created_at__lt=end).count()
            oqs = Order.objects.filter(created_at__gte=start, created_at__lt=end)
            orders_count = oqs.exclude(status__iexact='cancelled').count()
            revenue_sum = (
                oqs.exclude(status__iexact='cancelled')
                .aggregate(Sum('total_amount'))
                .get('total_amount__sum')
                or 0
            )
            revenue_val = float(revenue_sum)
            total_wishlisted += w
            total_in_cart += c
            total_orders += orders_count
            total_revenue += revenue_val
            data.append({"name": label, "wishlisted": w, "inCart": c, "orders": orders_count, "revenue": revenue_val})

    elif period == "Monthly":
        # Calendar current month up to today (not rolling 30 days)
        first_day = timezone.make_aware(datetime(now.year, now.month, 1), tz)
        # Last day of month
        if now.month == 12:
            next_month = timezone.make_aware(datetime(now.year + 1, 1, 1), tz)
        else:
            next_month = timezone.make_aware(datetime(now.year, now.month + 1, 1), tz)
        days_in_month = (next_month - first_day).days
        for i in range(days_in_month):
            bucket_start = first_day + timedelta(days=i)
            # Stop if bucket_start is in the future
            if bucket_start.date() > now.date():
                break
            bucket_end = bucket_start + timedelta(days=1)
            label = bucket_start.strftime('%d %b')  # e.g., 05 Jan
            w = WishlistItem.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end).count()
            c = CartItem.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end).count()
            oqs = Order.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end)
            orders_count = oqs.exclude(status__iexact='cancelled').count()
            revenue_sum = (
                oqs.exclude(status__iexact='cancelled')
                .aggregate(Sum('total_amount'))
                .get('total_amount__sum')
                or 0
            )
            revenue_val = float(revenue_sum)
            total_wishlisted += w
            total_in_cart += c
            total_orders += orders_count
            total_revenue += revenue_val
            data.append({"name": label, "wishlisted": w, "inCart": c, "orders": orders_count, "revenue": revenue_val})

    elif period == "Weekly":
        # Rolling last 7 days (to match KPI 7d)
        start = start_of_day(now - timedelta(days=6))
        for i in range(7):
            bucket_start = start + timedelta(days=i)
            bucket_end = bucket_start + timedelta(days=1)
            label = bucket_start.strftime('%a')  # Sun, Mon, ...
            w = WishlistItem.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end).count()
            c = CartItem.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end).count()
            oqs = Order.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end)
            orders_count = oqs.exclude(status__iexact='cancelled').count()
            revenue_sum = (
                oqs.exclude(status__iexact='cancelled')
                .aggregate(Sum('total_amount'))
                .get('total_amount__sum')
                or 0
            )
            revenue_val = float(revenue_sum)
            total_wishlisted += w
            total_in_cart += c
            total_orders += orders_count
            total_revenue += revenue_val
            data.append({"name": label, "wishlisted": w, "inCart": c, "orders": orders_count, "revenue": revenue_val})

    elif period == "Daily":
        # Rolling last 24 hours (to match KPI 24h)
        start = now - timedelta(hours=23)
        start = start.replace(minute=0, second=0, microsecond=0)
        for i in range(24):
            bucket_start = start + timedelta(hours=i)
            bucket_end = bucket_start + timedelta(hours=1)
            label = bucket_start.strftime('%H:00')
            w = WishlistItem.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end).count()
            c = CartItem.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end).count()
            oqs = Order.objects.filter(created_at__gte=bucket_start, created_at__lt=bucket_end)
            orders_count = oqs.exclude(status__iexact='cancelled').count()
            revenue_sum = (
                oqs.exclude(status__iexact='cancelled')
                .aggregate(Sum('total_amount'))
                .get('total_amount__sum')
                or 0
            )
            revenue_val = float(revenue_sum)
            total_wishlisted += w
            total_in_cart += c
            total_orders += orders_count
            total_revenue += revenue_val
            data.append({"name": label, "wishlisted": w, "inCart": c, "orders": orders_count, "revenue": revenue_val})
    else:
        return Response({"detail": "Invalid period"}, status=400)

    totals = {
        "wishlisted": total_wishlisted,
        "inCart": total_in_cart,
        "orders": total_orders,
        "revenue": total_revenue,
    }

    return Response({"period": period, "data": data, "totals": totals})

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticatedOrReadOnly
# from rest_framework.response import Response
# from django.db.models import Sum, Count
# from .models import Wishlist, CartItem
# from orders.models import Order  # adjust path

# @api_view(['GET'])
# @permission_classes([IsAuthenticatedOrReadOnly])
# def analytics_summary(request):
#     total_revenue = Order.objects.filter(status__in=['Completed', 'Dispatched']).aggregate(Sum('amount'))['amount__sum'] or 0
#     total_orders = Order.objects.exclude(status='Cancelled').count()
#     total_wishlist = Wishlist.objects.count()
#     total_cart = CartItem.objects.count()

#     return Response({
#         "revenue": total_revenue,
#         "orders": total_orders,
#         "wishlisted": total_wishlist,
#         "in_cart": total_cart
#     })

from django.db.models import Count

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def visitor_region_data(request):
    """
    Returns a breakdown of website visitors by region.
    """
    data = (
        Visitor.objects
        .values('region')
        .annotate(
            visitors=Count('ip_address', distinct=True),
            last_updated=Max('timestamp'),
        )
        .order_by('-visitors')
    )
    normalized = [
        {
            "region": row.get("region") or "Unknown",
            "visitors": row.get("visitors") or 0,
            "last_updated": row.get("last_updated"),
        }
        for row in data
    ]
    return Response(normalized)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def visitor_region_timeseries(request):
    """
    Returns visitor counts per region over time (distinct IPs).
    Query params:
      - period: '30d' (default), '7d', or '24h'
      - days (int): fallback for legacy clients (defaults to 30, max 90)
    Response shape:
      [
        { "timestamp": "2025-11-30T00:00:00Z", "region": "Lucknow (India)", "visitors": 5, "label": "Nov 30" },
        ...
      ]
    """
    period = (request.query_params.get("period") or "").lower()
    if period not in ("7d", "30d", "24h"):
        try:
            # legacy support for ?days=
            days = int(request.query_params.get("days", 30))
        except Exception:
            days = 30
        days = max(1, min(days, 90))
        period = "7d" if days <= 7 else "30d"
    now = timezone.now()

    if period == "24h":
        start_dt = now - timedelta(hours=23)
        qs = (
            Visitor.objects.filter(timestamp__gte=start_dt)
            .annotate(hour=TruncHour("timestamp"))
            .values("hour", "region")
            .annotate(visitors=Count("ip_address", distinct=True))
            .order_by("hour", "region")
        )
        payload = []
        for row in qs:
            ts = row.get("hour") or now
            payload.append(
                {
                    "timestamp": ts,
                    "region": row.get("region") or "Unknown",
                    "visitors": row.get("visitors") or 0,
                    "label": timezone.localtime(ts).strftime("%H:%M"),
                }
            )
        return Response(payload)

    # default: daily buckets (7d or 30d)
    days = 7 if period == "7d" else 30
    start_date = now.date() - timedelta(days=days - 1)
    qs = (
        Visitor.objects.filter(timestamp__date__gte=start_date)
        .annotate(day=TruncDate("timestamp"))
        .values("day", "region")
        .annotate(visitors=Count("ip_address", distinct=True))
        .order_by("day", "region")
    )
    payload = []
    for row in qs:
        day = row.get("day")
        payload.append(
            {
                "timestamp": day,
                "region": row.get("region") or "Unknown",
                "visitors": row.get("visitors") or 0,
                "label": day.strftime("%b %d") if day else "",
            }
        )
    return Response(payload)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_top_products(request):
    """
    Return top wishlisted and carted products for the admin analytics page.
    Response example:
    {
      "top_wishlisted": [{ "product_id": 1, "name": "...", "count": 12, "image": "url" }, ...],
      "top_carted": [{...}]
    }
    """
    try:
        limit = int(request.query_params.get("limit", 5))
    except Exception:
        limit = 5
    limit = max(1, min(limit, 50))

    def product_image(prod: Product):
        try:
            imgs = getattr(prod, "images", None) or []
            return imgs[0] if imgs else None
        except Exception:
            return None

    wishlist_qs = (
        WishlistItem.objects
        .values("product_id")
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )
    cart_qs = (
        CartItem.objects
        .values("product_id")
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )

    # Prefetch products for both sets in one query
    product_ids = set([w["product_id"] for w in wishlist_qs] + [c["product_id"] for c in cart_qs])
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids)}

    def map_entry(entry):
        pid = entry["product_id"]
        prod = products.get(pid)
        return {
            "product_id": pid,
            "name": getattr(prod, "name", None) or f"Product {pid}",
            "count": entry["count"],
            "image": product_image(prod),
        }

    payload = {
        "top_wishlisted": [map_entry(e) for e in wishlist_qs],
        "top_carted": [map_entry(e) for e in cart_qs],
    }
    return Response(payload)


def _apply_review_filters(request, queryset):
    """
    Shared filter helper for rating analytics and export.
    Supports ?product_id=, ?start_date=YYYY-MM-DD, ?end_date=YYYY-MM-DD.
    """
    product_id = request.query_params.get("product_id")
    if product_id:
        queryset = queryset.filter(product_id=product_id)

    def parse_date(value):
        try:
            return datetime.fromisoformat(value).date()
        except Exception:
            return None

    start_date = parse_date(request.query_params.get("start_date"))
    end_date = parse_date(request.query_params.get("end_date"))
    if start_date:
        queryset = queryset.filter(created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__date__lte=end_date)
    return queryset


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_rating_analysis(request):
    """
    Returns aggregated rating stats for the admin dashboard:
    - per-product averages + counts
    - recent reviews (latest 20)
    - overall summary
    """
    qs = ProductReview.objects.select_related("product", "customer", "order")
    qs = _apply_review_filters(request, qs)

    summary = qs.aggregate(
        average_rating=Avg("rating"),
        total_reviews=Count("id"),
    )
    product_stats = (
        qs.values("product_id", "product__name")
        .annotate(
            avg_rating=Avg("rating"),
            review_count=Count("id"),
            last_reviewed_at=Max("created_at"),
        )
        .order_by("-review_count", "product__name")
    )

    recent_qs = qs.order_by("-created_at")[:20]
    recent = []
    for r in recent_qs:
        recent.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": getattr(r.product, "name", None),
            "customer_name": getattr(r.customer, "name", None) or getattr(r.customer, "email", None),
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "order_id": r.order_id,
            "created_at": timezone.localtime(r.created_at).isoformat(),
        })

    payload = {
        "summary": {
            "average_rating": float(summary["average_rating"]) if summary["average_rating"] is not None else None,
            "total_reviews": summary.get("total_reviews", 0),
        },
        "products": [
            {
                "product_id": p["product_id"],
                "name": p.get("product__name"),
                "average_rating": float(p["avg_rating"]) if p["avg_rating"] is not None else None,
                "review_count": p["review_count"],
                "last_reviewed_at": p["last_reviewed_at"].isoformat() if p.get("last_reviewed_at") else None,
            }
            for p in product_stats
        ],
        "recent_reviews": recent,
    }
    return Response(payload, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_product_ratings(request):
    """
    Generate an Excel (xlsx) download of product ratings with dates.
    Supports optional product_id/start_date/end_date filters.
    """
    qs = ProductReview.objects.select_related("product", "customer", "order")
    qs = _apply_review_filters(request, qs).order_by("-created_at")

    try:
        from openpyxl import Workbook
    except ImportError:
        return Response(
            {"detail": "openpyxl is required to export Excel. Install it with `pip install openpyxl`."},
            status=500,
        )

    wb = Workbook()
    ws = wb.active
    ws.title = "Product Ratings"
    ws.append(["Product ID", "Product Name", "Customer", "Order ID", "Rating", "Title", "Comment", "Created At"])

    tz = timezone.get_current_timezone()
    for r in qs:
        ws.append([
            r.product_id,
            getattr(r.product, "name", None),
            getattr(r.customer, "name", None) or getattr(r.customer, "email", None),
            r.order_id,
            r.rating,
            r.title,
            r.comment,
            timezone.localtime(r.created_at, tz).strftime("%Y-%m-%d %H:%M"),
        ])

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"product-ratings-{timezone.now().strftime('%Y%m%d')}.xlsx"
    response = HttpResponse(
        stream.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
