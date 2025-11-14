from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from inventory.models import Product
from services.models import Service
from pets.models import PetProfile
from orders.models import Order, OrderItem, PurchaseFeedback, ProductFeedback
from appointments.models import Appointment
from accounts.models import Profile, LoginActivity


class Command(BaseCommand):
    help = 'COMPLETE RESET: Delete ALL data including accounts, products, pets, orders, services, and more'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('='*60))
        self.stdout.write(self.style.ERROR('🗑️  COMPLETE DATA RESET - DELETING ALL DATA!'))
        self.stdout.write(self.style.WARNING('='*60 + '\n'))
        
        try:
            self.stdout.write(self.style.WARNING('Starting complete data deletion...\n'))
            
            # Delete all Login Activities
            login_activity_count = LoginActivity.objects.count()
            LoginActivity.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {login_activity_count} login activities'))
            
            # Delete all User Profiles
            profile_count = Profile.objects.count()
            Profile.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {profile_count} user profiles'))
            
            # Delete all Products (Inventory)
            product_count = Product.objects.count()
            Product.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {product_count} products'))
            
            # Delete all Services
            service_count = Service.objects.count()
            Service.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {service_count} services'))
            
            # Delete all Pets
            pet_count = PetProfile.objects.count()
            PetProfile.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {pet_count} pets'))
            
            # Delete all Appointments
            appointment_count = Appointment.objects.count()
            Appointment.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {appointment_count} appointments'))
            
            # Delete all Feedback (Purchases/Product Feedback)
            purchase_feedback_count = PurchaseFeedback.objects.count()
            PurchaseFeedback.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {purchase_feedback_count} purchase feedback entries'))
            
            product_feedback_count = ProductFeedback.objects.count()
            ProductFeedback.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {product_feedback_count} product feedback entries'))
            
            # Delete all Orders (will cascade delete OrderItems)
            order_count = Order.objects.count()
            orderitem_count = OrderItem.objects.count()
            Order.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {order_count} orders'))
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {orderitem_count} order items'))
            
            # Delete all User Accounts (LAST - this deletes everything with CASCADE)
            user_count = User.objects.exclude(username='admin').count()  # Keep admin if exists
            User.objects.exclude(username='admin').all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {user_count} user accounts'))
            
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('✅ COMPLETE RESET SUCCESSFUL!'))
            self.stdout.write(self.style.SUCCESS('='*60))
            self.stdout.write(self.style.WARNING('\nDeleted:'))
            self.stdout.write(self.style.WARNING('  ✓ All User Accounts'))
            self.stdout.write(self.style.WARNING('  ✓ All Products'))
            self.stdout.write(self.style.WARNING('  ✓ All Services'))
            self.stdout.write(self.style.WARNING('  ✓ All Pets'))
            self.stdout.write(self.style.WARNING('  ✓ All Orders & Order Items'))
            self.stdout.write(self.style.WARNING('  ✓ All Purchases & Feedback'))
            self.stdout.write(self.style.WARNING('  ✓ All Appointments'))
            self.stdout.write(self.style.WARNING('  ✓ All Login Activities'))
            self.stdout.write(self.style.WARNING('  ✓ All User Profiles'))
            self.stdout.write(self.style.WARNING('\nDatabase is now CLEAN and ready for fresh data!\n'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error during deletion: {str(e)}'))
            raise
