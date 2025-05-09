from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, SaleViewSet, inventory_list_api  # ✅ import your API view
from . import views

router = DefaultRouter()
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'sales', SaleViewSet, basename='sales')

urlpatterns = [
    path('api/inventory/', inventory_list_api, name='inventory_list_api'),  # ✅ fixed API path
    path('api/', include(router.urls)),  # ✅ include DRF router URLs

    path('', views.index, name='index'),
    path('index/', views.index, name='index'),
    path('inventory/', views.inventory, name='inventory'),
    path('inventory-dashboard/', views.inventory_dashboard, name='inventory_dashboard'),
    path('receipt/', views.receipt, name='receipt'),
    path('sales/', views.sales, name='sales'),

    # Payment-related views
    path('payment-success/', views.payment_success, name='payment_success'),
    path('payment-required/', views.payment_required, name='payment_required'),
]
