from django.db import models
from django.contrib.auth.models import User
from inventory.models import Product
from services.models import Service


class Sale(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Debit/Credit Card'),
        ('online', 'Online Payment'),
    ]

    # Sale details
    sale_number = models.CharField(max_length=50, unique=True)
    sale_date = models.DateTimeField(auto_now_add=True)
    branch = models.CharField(max_length=20, choices=[('Matina', 'Matina'), ('Toril', 'Toril')])
    
    # Customer details
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    
    # Cashier
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales')
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # 12% VAT
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    change = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    # Reference
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-sale_date']
        indexes = [
            models.Index(fields=['branch', '-sale_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.sale_number} - {self.customer_name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate sale number if not present
        if not self.sale_number:
            from datetime import datetime
            import uuid
            # Use UUID to ensure uniqueness and avoid race conditions
            self.sale_number = f"SALE-{uuid.uuid4().hex[:12].upper()}"
        
        super().save(*args, **kwargs)


class SaleItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('product', 'Product'),
        ('service', 'Service'),
    ]

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    
    # Item details
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='sale_items')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='sale_items')
    
    # Item name (for record in case product/service is deleted)
    item_name = models.CharField(max_length=255)
    
    # Quantity and pricing
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Service specific (size if applicable)
    service_size = models.CharField(max_length=10, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.item_name} x{self.quantity}"
