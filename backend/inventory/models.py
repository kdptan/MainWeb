from django.db import models
from django.contrib.auth.models import User


class Supplier(models.Model):
    """Supplier management for inventory restocking"""
    name = models.CharField(max_length=255, unique=True)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    # allowed categories (display names)
    CATEGORY_PET_FOOD = 'Pet Food & Treats'
    CATEGORY_GROOMING = 'Grooming & Hygiene'
    CATEGORY_HEALTH = 'Health & Wellness'
    CATEGORY_ACCESSORIES = 'Accessories & Toys'
    CATEGORY_CAGES = 'Cages & Bedding'
    CATEGORY_FEEDING = 'Feeding Supplies'
    CATEGORY_CLEANING = 'Cleaning Supplies'
    CATEGORY_CHOICES = [
        (CATEGORY_PET_FOOD, CATEGORY_PET_FOOD),
        (CATEGORY_GROOMING, CATEGORY_GROOMING),
        (CATEGORY_HEALTH, CATEGORY_HEALTH),
        (CATEGORY_ACCESSORIES, CATEGORY_ACCESSORIES),
        (CATEGORY_CAGES, CATEGORY_CAGES),
        (CATEGORY_FEEDING, CATEGORY_FEEDING),
        (CATEGORY_CLEANING, CATEGORY_CLEANING),
    ]

    category = models.CharField(max_length=128, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    supplier = models.CharField(max_length=255, blank=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)
    reorder_quantity = models.IntegerField(default=0)
    BRANCH_MATINA = 'Matina'
    BRANCH_TORIL = 'Toril'
    BRANCH_CHOICES = [
        (BRANCH_MATINA, 'Matina'),
        (BRANCH_TORIL, 'Toril'),
    ]
    branch = models.CharField(max_length=32, choices=BRANCH_CHOICES, default=BRANCH_MATINA)
    # per-branch+category item number (1-based). Assigned on first save if missing.
    item_number = models.IntegerField(null=True, blank=True)
    remarks = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Markup percentages by category
    MARKUP_PERCENTAGES = {
        'Pet Food & Treats': 25,
        'Grooming & Hygiene': 40,
        'Health & Wellness': 40,
        'Accessories & Toys': 50,
        'Cages & Bedding': 40,
        'Feeding Supplies': 40,
        'Cleaning Supplies': 25,
    }

    def get_markup_percentage(self):
        """Get markup percentage for this product's category"""
        return self.MARKUP_PERCENTAGES.get(self.category, 25)  # Default 25% if not found

    def calculate_retail_price(self):
        """Calculate retail price based on unit cost and category markup"""
        from decimal import Decimal
        markup_percent = Decimal(str(self.get_markup_percentage()))
        return self.unit_cost * (Decimal('1') + markup_percent / Decimal('100'))

    def save(self, *args, **kwargs):
        # Automatically calculate retail_price based on unit_cost and category markup
        if self.unit_cost:
            self.retail_price = self.calculate_retail_price()
        
        # compute remarks automatically if not provided
        # Remarks logic:
        # - 'Out of Stock' when quantity == 0
        # - 'Reorder soon' when quantity <= reorder_level and quantity > 0
        # - 'In Stock' when quantity > reorder_level
        if not self.remarks:
            if self.quantity == 0:
                self.remarks = 'Out of Stock'
            elif self.quantity <= self.reorder_level:
                self.remarks = 'Reorder soon'
            else:
                self.remarks = 'In Stock'
        # assign per-branch+category item_number if not present (on create)
        if not self.item_number:
            # compute max existing item_number for same branch and category
            try:
                qs = Product.objects.filter(branch=self.branch, category=self.category).order_by('-item_number')
                last = qs.first()
                if last and last.item_number:
                    self.item_number = last.item_number + 1
                else:
                    self.item_number = 1
            except Exception:
                # fallback: set to 1
                self.item_number = 1

        super().save(*args, **kwargs)

    @property
    def formatted_id(self):
        # map branch to code
        branch_code = 'M' if self.branch == self.BRANCH_MATINA else 'T'
        # map category to letter codes A-G in the order defined above
        cat_map = {
            self.CATEGORY_PET_FOOD: 'A',
            self.CATEGORY_GROOMING: 'B',
            self.CATEGORY_HEALTH: 'C',
            self.CATEGORY_ACCESSORIES: 'D',
            self.CATEGORY_CAGES: 'E',
            self.CATEGORY_FEEDING: 'F',
            self.CATEGORY_CLEANING: 'G',
        }
        cat_code = cat_map.get(self.category, 'X')
        num = self.item_number or self.id or 0
        return f"{branch_code}-{cat_code}-{str(num).zfill(3)}"

    def __str__(self):
        return f"{self.name} ({self.category})"


class ProductHistory(models.Model):
    """Track all inventory changes - additions, subtractions, restocking"""
    TRANSACTION_TYPE_CHOICES = [
        ('addition', 'Product Added'),
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('adjustment', 'Adjustment'),
        ('damaged', 'Damaged/Loss'),
        ('return', 'Customer Return'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    quantity_change = models.IntegerField()  # positive for add, negative for subtract
    old_quantity = models.IntegerField()
    new_quantity = models.IntegerField()
    supplier = models.CharField(max_length=255, blank=True)  # for restock transactions
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # quantity_change * unit_cost
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # amount paid for this transaction
    reason = models.TextField(blank=True)  # reason for adjustment/change
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Product History'
    
    def __str__(self):
        return f"{self.product.name} - {self.transaction_type} (+{self.quantity_change}) on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
