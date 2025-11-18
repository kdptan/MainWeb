from django.contrib import admin
from .models import Appointment, AppointmentFeedback


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'service', 'branch', 'appointment_date', 'start_time', 'end_time', 'status', 'created_at']
    list_filter = ['status', 'branch', 'appointment_date', 'created_at']
    search_fields = ['user__username', 'service__service_name', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'end_time']
    date_hierarchy = 'appointment_date'


@admin.register(AppointmentFeedback)
class AppointmentFeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'appointment', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__username', 'appointment__service__service_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

