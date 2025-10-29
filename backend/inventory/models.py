from django.db import models


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
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
