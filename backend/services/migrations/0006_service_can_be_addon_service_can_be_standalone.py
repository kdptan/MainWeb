# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0005_service_is_solo'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='can_be_addon',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='service',
            name='can_be_standalone',
            field=models.BooleanField(default=True),
        ),
    ]
