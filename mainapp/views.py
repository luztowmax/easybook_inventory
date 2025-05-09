from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .utils import paid_required
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication
from django.views.decorators.csrf import csrf_exempt
from .models import InventoryItem, Sale, Cart, Receipt, ReceiptItem
from .serializers import InventoryItemSerializer, SaleSerializer
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

# ✅ Inventory view with staff-only delete
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if not request.user.is_staff:
            return Response({"error": "Only staff users can delete items."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

# ✅ Checkout cart endpoint with token
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def checkout_cart(request):
    user = request.user
    cart_items = Cart.objects.filter(user=user)

    if not cart_items.exists():
        return Response({'error': 'Cart is empty'}, status=400)

    total = sum(item.product.price * item.quantity for item in cart_items)

    receipt = Receipt.objects.create(user=user, total=total)
    receipt_items = []

    for item in cart_items:
        ReceiptItem.objects.create(
            receipt=receipt,
            product=item.product,
            quantity=item.quantity,
            total_price=item.product.price * item.quantity
        )
        receipt_items.append({
            "name": item.product.name,
            "quantity": item.quantity,
            "total_price": item.product.price * item.quantity
        })
        item.delete()  # Clear cart

    customer_name = f"{user.first_name} {user.last_name}".strip()

    return Response({
        "id": receipt.id,
        "customer_name": customer_name,
        "date": receipt.created_at,
        "items": receipt_items,
        "total": total
    })

# ✅ Public and private inventory list
@csrf_exempt
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])  # GET is public; POST checks request.user below
def inventory_list_api(request):
    if request.method == 'GET':
        try:
            items = InventoryItem.objects.all()
            serializer = InventoryItemSerializer(items, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching inventory items: {e}")
            return Response({"error": "Failed to fetch inventory items."}, status=500)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required to create inventory items."}, status=403)
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# ✅ User-specific inventory items
class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InventoryItem.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# ✅ User-specific sales records
class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Sale.objects.filter(customer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

# ✅ Web views
def index(request):
    return render(request, 'index.html')

@paid_required
def inventory_dashboard(request):
    return render(request, 'inventory/index.html')

@login_required
def payment_success(request):
    request.user.has_paid = True
    request.user.save()
    return redirect('inventory_dashboard')

def payment_required(request):
    return render(request, 'payment_required.html')

def inventory(request):
    return render(request, 'inventory.html')

def receipt(request):
    return render(request, 'receipt.html')

def sales(request):
    return render(request, 'sales.html')
