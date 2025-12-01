from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from .views import VisitorRegionDataViewSet
from .views import (
    MainCategoryViewSet, SubCategoryViewSet,
    MaterialViewSet, ColorViewSet, OccasionViewSet
)


router = DefaultRouter()
router.register('customers', CustomerViewSet)
router.register('products', ProductViewSet)
router.register('orders', OrderViewSet)
router.register('discounts', DiscountViewSet)
router.register('banners', BannerViewSet)
# router.register('notes', NoteViewSet)
router.register(r'notifications', NotificationViewSet, basename="notification")
# router.register('rpd', RPDViewSet)
router.register('rpd', RichProductDescriptionViewSet)
# router.register(r'analytics', VisitorRegionDataViewSet)
router.register(r'visitor-region-data', VisitorRegionDataViewSet, basename='visitor-region-data')
router.register(r'main-categories', MainCategoryViewSet)
router.register(r'subcategories', SubCategoryViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'colors', ColorViewSet)
router.register(r'occasions', OccasionViewSet)
router.register(r'collage-items', HomeCollageItemViewSet)
router.register(r'logs', ActivityLogViewSet, basename="logs")
router.register('notes', NoteViewSet, basename='note')
router.register('customer-accounts', CustomerAccountViewSet, basename="customer-accounts")


urlpatterns = [
    path('', include(router.urls)),path('record-visitor/', record_visitor, name='record-visitor'),
    path('backup-db/', backup_database, name='backup-database'),
    path('backups/', list_backups, name='list-backups'),
    path('restore-db/', restore_database, name='restore-database'),
]
