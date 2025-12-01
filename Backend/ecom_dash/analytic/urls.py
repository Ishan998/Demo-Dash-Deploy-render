from django.urls import path
from . import views

urlpatterns = [
    path('analytics/', views.analytics_overview, name='analytics'),
    path("analytics-summary/", views.analytics_overview, name="analytics-summary"),
    path("analytics-timeseries/", views.wishlist_cart_timeseries, name="analytics-timeseries"),
    path("visitor-region-data/", views.visitor_region_data, name="visitor-region-data"),
    path("visitor-region-timeseries/", views.visitor_region_timeseries, name="visitor-region-timeseries"),
    path("log-visitor/", views.log_visitor, name="log-visitor"),
    path("analytics-top-products/", views.analytics_top_products, name="analytics-top-products"),
    path("customer-rating-analysis/", views.customer_rating_analysis, name="customer-rating-analysis"),
    path("export-product-ratings/", views.export_product_ratings, name="export-product-ratings"),
]
