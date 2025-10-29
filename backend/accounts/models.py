from django.db import models
from django.conf import settings


class Profile(models.Model):
	"""Simple profile to store additional account metadata like role."""
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
	role = models.CharField(max_length=32, default='user')
	profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

	def __str__(self):
		return f"{self.user.username} ({self.role})"
