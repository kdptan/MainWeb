from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'service', 'branch', 'appointment_date', 'start_time', 'end_time', 'status', 'created_at']
    list_filter = ['status', 'branch', 'appointment_date', 'created_at']
    search_fields = ['user__username', 'service__service_name', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'end_time']
    date_hierarchy = 'appointment_date'
