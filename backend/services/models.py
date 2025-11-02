from django.db import models


class Service(models.Model):
    service_name = models.CharField(max_length=255)
    description = models.TextField()
    inclusions = models.JSONField(default=list)  # Store as list of strings
    duration_minutes = models.IntegerField()  # Store duration in minutes for consistency
    may_overlap = models.BooleanField(default=False)  # Allow multiple bookings at same time
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.service_name

    class Meta:
        ordering = ['-created_at']
