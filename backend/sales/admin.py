from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['sale_number', 'customer_name', 'branch', 'total', 'payment_method', 'status', 'sale_date']
    list_filter = ['status', 'branch', 'payment_method', 'sale_date']
    search_fields = ['sale_number', 'customer_name', 'customer_email', 'customer_phone']
    readonly_fields = ['sale_number', 'sale_date', 'created_at', 'updated_at']
    inlines = [SaleItemInline]
    date_hierarchy = 'sale_date'


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'quantity', 'unit_price', 'subtotal', 'sale']
    list_filter = ['item_type', 'created_at']
    search_fields = ['item_name']
    readonly_fields = ['created_at']
