# Generated migration

from django.db import migrations, models
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0006_service_can_be_addon_service_can_be_standalone'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='addon_price',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='service',
            name='standalone_price',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10),
        ),
    ]
