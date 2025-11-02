from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['service_name', 'duration_minutes', 'created_at']
    search_fields = ['service_name', 'description']
