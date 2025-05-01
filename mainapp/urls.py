from django.urls import path
from . import views

urlpatterns = [
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
