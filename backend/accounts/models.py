from django.db import models
from django.conf import settings


class Profile(models.Model):
	"""Simple profile to store additional account metadata like role."""
	LOCATION_CHOICES = [
		('Matina', 'Matina'),
		('Toril', 'Toril'),
	]
	
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
	role = models.CharField(max_length=32, default='user')
	profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
	location = models.CharField(max_length=50, choices=LOCATION_CHOICES, default='Matina')

	def __str__(self):
		return f"{self.user.username} ({self.role})"


class LoginActivity(models.Model):
	"""Track user login activities."""
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='login_activities')
	login_time = models.DateTimeField(auto_now_add=True)
	ip_address = models.GenericIPAddressField(null=True, blank=True)
	user_agent = models.TextField(blank=True)

	class Meta:
		ordering = ['-login_time']
		verbose_name_plural = 'Login Activities'

	def __str__(self):
		return f"{self.user.username} - {self.login_time}"
