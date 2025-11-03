from django.core.management.base import BaseCommand
from orders.models import Order, OrderItem


class Command(BaseCommand):
    help = 'Clear all orders and order items'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting order deletion...'))
        
        # Delete all Order Items (will cascade delete from orders)
        order_item_count = OrderItem.objects.count()
        order_count = Order.objects.count()
        
        Order.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {order_count} orders'))
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {order_item_count} order items'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ All orders cleared successfully!'))
