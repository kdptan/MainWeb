from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'supplier', 'quantity', 'reorder_level', 'reorder_quantity', 'remarks')
    search_fields = ('name', 'category', 'supplier')
