from django.core.management.base import BaseCommand
from inventory.models import Product
from services.models import Service
from orders.models import PurchaseFeedback, ProductFeedback


class Command(BaseCommand):
    help = 'Clear all data from Inventory, Products, Services, and Feedback'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting data deletion...'))
        
        # Delete all Products (Inventory)
        product_count = Product.objects.count()
        Product.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {product_count} products'))
        
        # Delete all Services
        service_count = Service.objects.count()
        Service.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {service_count} services'))
        
        # Delete all Purchase Feedback
        purchase_feedback_count = PurchaseFeedback.objects.count()
        PurchaseFeedback.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {purchase_feedback_count} purchase feedback entries'))
        
        # Delete all Product Feedback
        product_feedback_count = ProductFeedback.objects.count()
        ProductFeedback.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {product_feedback_count} product feedback entries'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ All data cleared successfully!'))
        self.stdout.write(self.style.WARNING('\nNote: Orders and other related data have NOT been deleted.'))
