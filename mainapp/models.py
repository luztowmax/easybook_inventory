from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    has_paid = models.BooleanField(default=False)

class Product(models.Model):
    name = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return self.name


# Create your models here.
