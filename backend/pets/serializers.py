from rest_framework import serializers
from .models import PetProfile
from django.contrib.auth.models import User


class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class PetProfileSerializer(serializers.ModelSerializer):
    owner_details = OwnerSerializer(source='owner', read_only=True)
    
    class Meta:
        model = PetProfile
        fields = ['id', 'owner', 'owner_details', 'pet_picture', 'pet_name', 'breed', 'branch',
                  'age_value', 'age_unit', 'birthdate', 'gender', 'weight_lbs', 
                  'additional_notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
