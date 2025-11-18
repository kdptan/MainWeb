from django.contrib import admin
from .models import Order, OrderItem, PurchaseFeedback, ProductFeedback, Notification

# Register your models here.

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['item_type', 'product', 'service', 'quantity', 'price']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'branch', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'branch', 'created_at']
    search_fields = ['user__username', 'id']
    readonly_fields = ['created_at', 'completed_at']
    inlines = [OrderItemInline]
    list_per_page = 5  # Show 5 orders per page

    ordering = ['-created_at']  # Most recent orders first

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'item_type', 'get_item_name', 'quantity', 'price']
    list_filter = ['item_type']
    
    def get_item_name(self, obj):
        if obj.item_type == 'product' and obj.product:
            return obj.product.name
        elif obj.item_type == 'service' and obj.service:
            return obj.service.name
        return 'Unknown'
    get_item_name.short_description = 'Item Name'

@admin.register(PurchaseFeedback)
class PurchaseFeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__username', 'order__id', 'comment']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        """Admin can see all purchase feedback"""
        return super().get_queryset(request)


@admin.register(ProductFeedback)
class ProductFeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'order', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at', 'product']
    search_fields = ['user__username', 'product__name', 'order__id', 'comment']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        """Product feedback is public, so admin can see all"""
        return super().get_queryset(request)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'order', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'order__order_id', 'message']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
