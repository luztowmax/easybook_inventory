from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .utils import paid_required

# Landing page
def index(request):
    return render(request, 'index.html')

# Inventory dashboard - requires user to be logged in and have paid
@paid_required
def inventory_dashboard(request):
    return render(request, 'inventory/index.html')

# Called after successful payment to update user status and redirect to dashboard
@login_required
def payment_success(request):
    request.user.has_paid = True
    request.user.save()
    return redirect('inventory_dashboard')

# Displayed if user tries to access inventory without paying
def payment_required(request):
    return render(request, 'payment_required.html')

# Other inventory-related pages
def inventory(request):
    return render(request, 'inventory.html')

def receipt(request):
    return render(request, 'receipt.html')

def sales(request):
    return render(request, 'sales.html')
