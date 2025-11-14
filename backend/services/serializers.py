from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'service_name', 'description', 'inclusions', 'duration_minutes', 'may_overlap', 
                  'is_solo', 'can_be_addon', 'can_be_standalone', 'addon_price', 'standalone_price',
                  'has_sizes', 'base_price', 'small_price', 'medium_price', 'large_price', 'extra_large_price', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
