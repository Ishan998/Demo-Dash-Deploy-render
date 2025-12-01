from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicProductViewSet, CustomerAuthViewSet,
    AddressViewSet, WishlistViewSet, CartViewSet, PublicBannerViewSet, ProductReviewViewSet, CustomerProfileViewSet,
    home_sections, products_by_tag, checkout, customer_orders, health, ping, _bad_request,
    list_main_categories, list_materials, list_colors, list_crystals, list_subcategories, list_occasions, list_collage_items,
)

router = DefaultRouter()
router.register(r"products", PublicProductViewSet, basename="storefront-products")
router.register(r"auth", CustomerAuthViewSet, basename="storefront-auth")
router.register(r"addresses", AddressViewSet, basename="storefront-addresses")
router.register(r"wishlist",  WishlistViewSet, basename="storefront-wishlist")
router.register(r"cart",      CartViewSet, basename="storefront-cart")
router.register(r"banners",   PublicBannerViewSet, basename="storefront-banners")
router.register(r"reviews",   ProductReviewViewSet, basename="storefront-reviews")
router.register(r"profile",   CustomerProfileViewSet, basename="storefront-profile")

urlpatterns = [
    path("health/", health),
    path("ping/", ping),
    path("oops/", _bad_request),
    path("home-sections/", home_sections, name="home-sections"),
    path("products/by-tag/", products_by_tag, name="storefront-products-by-tag"),
    path("categories/", list_main_categories, name="storefront-categories"),
    path("subcategories/", list_subcategories, name="storefront-subcategories"),
    path("materials/", list_materials, name="storefront-materials"),
    path("colors/", list_colors, name="storefront-colors"),
    path("crystals/", list_crystals, name="storefront-crystals"),
    path("occasions/", list_occasions, name="storefront-occasions"),
    path("collage-items/", list_collage_items, name="storefront-collage-items"),
    path("checkout/", checkout, name="checkout"),
    path("orders/", customer_orders, name="customer-orders"),
    path("", include(router.urls)),
]
