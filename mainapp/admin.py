from django.contrib import admin
from django.urls import path
from .models import Product

urlpatterns = [
    path('admin/', admin.site.urls),
]

# Register your models here.
