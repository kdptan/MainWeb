from django.db import models
from django.contrib.auth.models import User


class PetProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    
    BRANCH_CHOICES = [
        ('Matina', 'Matina'),
        ('Toril', 'Toril'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pets')
    pet_picture = models.ImageField(upload_to='pet_pics/', blank=True, null=True)
    pet_name = models.CharField(max_length=100)
    breed = models.CharField(max_length=100)
    branch = models.CharField(max_length=50, choices=BRANCH_CHOICES, default='Matina')
    age_value = models.IntegerField()
    age_unit = models.CharField(max_length=10, choices=[('months', 'Months'), ('years', 'Years')])
    birthdate = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    weight_lbs = models.DecimalField(max_digits=5, decimal_places=2)
    additional_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.pet_name} ({self.owner.username})"

    class Meta:
        ordering = ['-created_at']
