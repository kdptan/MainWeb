from django.db import models
from django.contrib.auth.models import User
from inventory.models import Product
from services.models import Service
import random
import string

# Create your models here.

def generate_unique_order_id():
    """Generate a unique 8-digit order ID"""
    while True:
        order_id = str(random.randint(10000000, 99999999))  # 8-digit random number
        if not Order.objects.filter(order_id=order_id).exists():
            return order_id

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('available_for_pickup', 'Available for Pickup'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    BRANCH_CHOICES = [
        ('Matina', 'Matina'),
        ('Toril', 'Toril'),
    ]
    
    order_id = models.CharField(max_length=8, unique=True, db_index=True, null=True, blank=True)  # Unique 8-digit order ID
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    branch = models.CharField(max_length=20, choices=BRANCH_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    change = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Generate unique 8-digit order ID if not already set
        if not self.order_id:
            while True:
                order_id = str(random.randint(10000000, 99999999))  # 8-digit random number
                if not Order.objects.filter(order_id=order_id).exists():
                    self.order_id = order_id
                    break
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order #{self.order_id} - {self.user.username} - {self.status}"


class OrderItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('product', 'Product'),
        ('service', 'Service'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=10, choices=ITEM_TYPE_CHOICES)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order
    
    def __str__(self):
        item_name = self.product.name if self.product else self.service.name
        return f"{item_name} x{self.quantity}"


class PurchaseFeedback(models.Model):
    """Overall purchase/order feedback - Admin access only"""
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Purchase Feedback'
        verbose_name_plural = 'Purchase Feedbacks'
    
    def __str__(self):
        return f"Purchase Feedback for Order #{self.order.id} - {self.rating} stars"


# Keep backward compatibility
Feedback = PurchaseFeedback


class ProductFeedback(models.Model):
    """Individual product feedback - Public display on products page"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='product_feedbacks')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['order', 'product']  # One feedback per product per order
        verbose_name = 'Product Feedback'
        verbose_name_plural = 'Product Feedbacks'
    
    def __str__(self):
        return f"Product Feedback: {self.product.name} in Order #{self.order.id} - {self.rating} stars"
