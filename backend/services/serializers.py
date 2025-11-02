from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'service_name', 'description', 'inclusions', 'duration_minutes', 'may_overlap', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
