from rest_framework import serializers
from .models import Order, OrderItem, PurchaseFeedback, ProductFeedback
from inventory.serializers import ProductSerializer
from services.serializers import ServiceSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)
    item_name = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'item_type', 'product', 'service', 'product_details', 'service_details', 
                  'quantity', 'price', 'item_name']
    
    def get_item_name(self, obj):
        if obj.item_type == 'product' and obj.product:
            return obj.product.name
        elif obj.item_type == 'service' and obj.service:
            return obj.service.name
        return 'Unknown'


class PurchaseFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for overall purchase/order feedback - Admin access only"""
    username = serializers.CharField(source='user.username', read_only=True)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_created_at = serializers.DateTimeField(source='order.created_at', read_only=True)
    
    class Meta:
        model = PurchaseFeedback
        fields = ['id', 'order', 'order_id', 'order_created_at', 'user', 'username', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']


# Keep backward compatibility
FeedbackSerializer = PurchaseFeedbackSerializer


class ProductFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for individual product feedback - Public display"""
    username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = ProductFeedback
        fields = ['id', 'order', 'product', 'product_name', 'user', 'username', 
                  'user_first_name', 'user_last_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user = serializers.SerializerMethodField()
    feedback = FeedbackSerializer(read_only=True)
    has_feedback = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'username', 'branch', 'status', 'total_price', 'notes',
                  'created_at', 'completed_at', 'items', 'feedback', 'has_feedback']
        read_only_fields = ['created_at', 'completed_at']
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }
    
    def get_has_feedback(self, obj):
        return hasattr(obj, 'feedback')


class CreateOrderSerializer(serializers.Serializer):
    branch = serializers.ChoiceField(choices=[('Matina', 'Matina'), ('Toril', 'Toril')])
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField())
    
    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")
        
        for item in items:
            if 'item_type' not in item or 'id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Each item must have item_type, id, and quantity.")
            
            if item['item_type'] not in ['product', 'service']:
                raise serializers.ValidationError("item_type must be either 'product' or 'service'.")
            
            if item['quantity'] < 1:
                raise serializers.ValidationError("Quantity must be at least 1.")
        
        return items
