from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    formatted_id = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'description', 'supplier', 'unit_cost', 'quantity', 'reorder_level', 'reorder_quantity', 'branch', 'item_number', 'formatted_id', 'remarks', 'created_at']
        read_only_fields = ['id', 'created_at', 'item_number', 'formatted_id']

    def get_formatted_id(self, obj):
        try:
            return obj.formatted_id
        except Exception:
            return None
