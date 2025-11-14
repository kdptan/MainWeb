from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = 'Clear all data except Accounts app'

    def handle(self, *args, **options):
        # Get all models except from accounts app
        models_to_clear = []
        
        for app_config in apps.get_app_configs():
            if app_config.name != 'accounts':
                for model in app_config.get_models():
                    models_to_clear.append(model)
        
        # Clear data from each model
        for model in models_to_clear:
            count = model.objects.all().count()
            model.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f'Cleared {count} records from {model._meta.label}')
            )
        
        # Reset sequences for all tables (PostgreSQL/MySQL compatibility)
        with connection.cursor() as cursor:
            for model in models_to_clear:
                table_name = model._meta.db_table
                try:
                    if connection.vendor == 'postgresql':
                        sequence_name = f'{table_name}_id_seq'
                        cursor.execute(f'ALTER SEQUENCE {sequence_name} RESTART WITH 1;')
                    elif connection.vendor == 'mysql':
                        cursor.execute(f'ALTER TABLE {table_name} AUTO_INCREMENT = 1;')
                    elif connection.vendor == 'sqlite':
                        # SQLite doesn't need sequence reset
                        pass
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'Could not reset sequence for {table_name}: {e}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS('✓ All data cleared successfully (except Accounts)')
        )
