from django.contrib.auth.models import AbstractUser
from django.db import models

class InventoryOwner(AbstractUser):
    has_paid = models.BooleanField(default=False)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    payment_made_date = models.DateTimeField(blank=True, null=True)
    subscription_expiry_date = models.DateTimeField(blank=True, null=True)
    payment_notification_sent = models.BooleanField(default=False)
    subscription_expiry_notification_sent = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    def notify_payment_made(self):
        # Placeholder for notification logic when payment is made
        if not self.payment_notification_sent:
            # Send email or SMS notification here
            self.payment_notification_sent = True
            self.save(update_fields=['payment_notification_sent'])

    def notify_subscription_expiry(self):
        # Placeholder for notification logic when subscription is about to expire
        if not self.subscription_expiry_notification_sent:
            # Send email or SMS notification here
            self.subscription_expiry_notification_sent = True
            self.save(update_fields=['subscription_expiry_notification_sent'])

class Product(models.Model):
    name = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return self.name


class Client(models.Model):
    admin = models.ForeignKey(InventoryOwner, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=50)
    # 


class InventoryItem(models.Model):
    owner = models.ForeignKey(InventoryOwner, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    size = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.size}) - {self.owner.username}"


class Sale(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity_sold = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    customer = models.ForeignKey(to=Client, on_delete=models.CASCADE)
    def __str__(self):
        return f"Sale #{self.id} - {self.item.name} - {self.customer.first_name}"
    
class Cart(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Add more fields as needed, such as item, quantity, etc.

    def __str__(self):
        return f"Cart of {self.client.first_name} {self.client.last_name}"

class Receipt(models.Model):
    receipt_number = models.CharField(max_length=50)
    sale = models.ForeignKey('Sale', on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.receipt_number

class ReceiptItem(models.Model):
    receipt = models.ForeignKey('Receipt', on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)  # Assuming you have a Product model
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    

