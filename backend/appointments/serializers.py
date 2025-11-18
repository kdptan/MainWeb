from rest_framework import serializers
from .models import Appointment, AppointmentFeedback
from services.serializers import ServiceSerializer
from pets.serializers import PetProfileSerializer
from django.contrib.auth.models import User


class UserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class AppointmentSerializer(serializers.ModelSerializer):
    service_details = ServiceSerializer(source='service', read_only=True)
    pet_details = PetProfileSerializer(source='pet', read_only=True)
    user_details = UserDetailsSerializer(source='user', read_only=True)
    add_ons = ServiceSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    has_feedback = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='service.service_name', read_only=True)
    pet_name = serializers.CharField(source='pet.pet_name', read_only=True)
    breed = serializers.CharField(source='pet.breed', read_only=True)
    time_slot = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'user', 'username', 'user_details', 'service', 'service_details', 'service_name',
            'pet', 'pet_details', 'pet_name', 'breed', 'add_ons', 'branch', 'appointment_date', 
            'start_time', 'end_time', 'time_slot', 'duration_minutes', 'status', 'notes', 
            'amount_paid', 'change', 'has_feedback', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'end_time']
    
    def get_has_feedback(self, obj):
        return hasattr(obj, 'feedback')
    
    def get_time_slot(self, obj):
        return f"{obj.start_time.strftime('%I:%M %p')} - {obj.end_time.strftime('%I:%M %p')}"


class CreateAppointmentSerializer(serializers.Serializer):
    service = serializers.IntegerField()
    pet = serializers.IntegerField(required=False, allow_null=True)
    add_ons = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])
    branch = serializers.ChoiceField(choices=[('Matina', 'Matina'), ('Toril', 'Toril')])
    appointment_date = serializers.DateField()
    start_time = serializers.TimeField()
    notes = serializers.CharField(required=False, allow_blank=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    change = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)


class AppointmentFeedbackSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    service_name = serializers.CharField(source='appointment.service.service_name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)
    
    class Meta:
        model = AppointmentFeedback
        fields = ['id', 'appointment', 'user', 'username', 'rating', 'comment', 
                  'service_name', 'appointment_date', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
