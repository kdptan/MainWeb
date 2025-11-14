from rest_framework import serializers
from .models import Appointment
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
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'user', 'username', 'user_details', 'service', 'service_details', 'pet', 'pet_details',
            'add_ons', 'branch', 'appointment_date', 'start_time', 'end_time', 'duration_minutes',
            'status', 'notes', 'amount_paid', 'change', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'end_time']


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
