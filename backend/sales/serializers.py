from rest_framework import serializers
from .models import Sale, SaleItem
from inventory.serializers import ProductSerializer
from services.serializers import ServiceSerializer


class SaleItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'item_type', 'product', 'product_details', 'service', 'service_details',
            'item_name', 'quantity', 'unit_price', 'subtotal', 'service_size'
        ]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'sale_date', 'branch', 'customer_name', 'customer_phone',
            'customer_email', 'cashier', 'cashier_name', 'items', 'subtotal', 'discount',
            'tax', 'total', 'payment_method', 'amount_paid', 'change', 'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['sale_number', 'subtotal', 'tax', 'total', 'change', 'created_at', 'updated_at']


class CreateSaleSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    customer_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    branch = serializers.ChoiceField(choices=[('Matina', 'Matina'), ('Toril', 'Toril')])
    payment_method = serializers.ChoiceField(choices=[('cash', 'Cash'), ('card', 'Debit/Credit Card'), ('online', 'Online Payment')])
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Items
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

    def validate_customer_email(self, value):
        if value == '':
            return None
        return value
