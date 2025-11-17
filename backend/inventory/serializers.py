from rest_framework import serializers
from .models import Product, ProductHistory, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'email', 'phone', 'address', 'city', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    formatted_id = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'description', 'supplier', 'unit_cost', 'retail_price', 'quantity', 'reorder_level', 'reorder_quantity', 'branch', 'item_number', 'formatted_id', 'remarks', 'created_at']
        read_only_fields = ['id', 'created_at', 'item_number', 'formatted_id', 'retail_price']

    def get_formatted_id(self, obj):
        try:
            return obj.formatted_id
        except Exception:
            return None


class ProductHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_formatted_id = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ProductHistory
        fields = [
            'id', 'product', 'product_name', 'product_formatted_id', 'user', 'user_name',
            'transaction_type', 'quantity_change', 'old_quantity', 'new_quantity',
            'supplier', 'unit_cost', 'total_cost', 'amount_paid', 'reason', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp', 'old_quantity', 'new_quantity']
    
    def get_product_formatted_id(self, obj):
        try:
            return obj.product.formatted_id
        except Exception:
            return None
