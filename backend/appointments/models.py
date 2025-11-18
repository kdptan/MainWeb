from django.db import models
from django.contrib.auth.models import User
from services.models import Service
from pets.models import PetProfile


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    BRANCH_CHOICES = [
        ('Matina', 'Matina'),
        ('Toril', 'Toril'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='appointments')
    pet = models.ForeignKey(PetProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    add_ons = models.ManyToManyField(Service, related_name='appointment_addons', blank=True, limit_choices_to={'is_solo': True})
    branch = models.CharField(max_length=20, choices=BRANCH_CHOICES)
    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    change = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['appointment_date', 'start_time']
        # Prevent double booking - no overlapping appointments
        constraints = [
            models.UniqueConstraint(
                fields=['branch', 'appointment_date', 'start_time'],
                condition=models.Q(status__in=['pending', 'confirmed']),
                name='unique_active_appointment_slot'
            )
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.service.service_name} on {self.appointment_date} at {self.start_time}"
    
    @property
    def duration_minutes(self):
        return self.service.duration_minutes


class AppointmentFeedback(models.Model):
    """
    Feedback for completed appointments - displayed publicly
    Similar to product feedback system
    """
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointment_feedbacks')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.appointment.service.service_name} - {self.rating} stars"
