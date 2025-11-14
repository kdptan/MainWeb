from django.db import models
from decimal import Decimal


class Service(models.Model):
    service_name = models.CharField(max_length=255)
    description = models.TextField()
    inclusions = models.JSONField(default=list)  # Store as list of strings
    duration_minutes = models.IntegerField()  # Store duration in minutes for consistency
    may_overlap = models.BooleanField(default=False)  # Allow multiple bookings at same time
    is_solo = models.BooleanField(default=False)  # True for solo services, False for package services
    can_be_addon = models.BooleanField(default=True)  # Can be used as an add-on
    can_be_standalone = models.BooleanField(default=True)  # Can be purchased standalone
    addon_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))  # Price when used as add-on
    standalone_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))  # Price when purchased standalone
    
    # Pricing
    has_sizes = models.BooleanField(default=False)  # Toggle for size-based pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))  # Price if no sizes
    
    # Size-based pricing (only used if has_sizes=True)
    small_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    medium_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    large_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    extra_large_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.service_name

    class Meta:
        ordering = ['-created_at']
