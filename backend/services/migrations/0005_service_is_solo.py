# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0004_service_base_price_service_extra_large_price_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='is_solo',
            field=models.BooleanField(default=False),
        ),
    ]
