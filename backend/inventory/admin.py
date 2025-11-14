from django.contrib import admin
from .models import Product, ProductHistory, Supplier


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'supplier', 'quantity', 'reorder_level', 'reorder_quantity', 'remarks')
    search_fields = ('name', 'category', 'supplier')


@admin.register(ProductHistory)
class ProductHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'transaction_type', 'quantity_change', 'old_quantity', 'new_quantity', 'user', 'timestamp')
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('product__name', 'user__username', 'reason')
    readonly_fields = ('timestamp', 'old_quantity', 'new_quantity')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'contact_person', 'email', 'phone', 'city', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'email', 'contact_person', 'city')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'contact_person', 'email', 'phone')
        }),
        ('Address', {
            'fields': ('address', 'city')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
