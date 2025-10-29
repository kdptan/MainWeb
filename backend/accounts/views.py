from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
import logging

from .serializers import RegisterSerializer
from .serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


class RegisterView(APIView):
	"""Registration endpoint that creates a user and sends a welcome email.

	This view returns structured errors on validation failure and logs request data
	to help debugging common client/server mismatch issues.
	"""

	def post(self, request):
		# Log raw body for debugging (may be large — keep minimal in production)
		try:
			logger.debug('Register request data: %s', request.data)
		except Exception:
			logger.exception('Failed to read request data')

		serializer = RegisterSerializer(data=request.data)
		if not serializer.is_valid():
			# Log errors to help debug why client sees 400
			logger.info('Registration validation failed: %s', serializer.errors)
			return Response({'detail': 'Registration failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

		# Create the user. Role (user/admin) is handled by the serializer.create() which creates a Profile and sets is_staff for admin.
		role = serializer.validated_data.get('role', 'user')
		user = serializer.save()

		# send welcome email (console backend in development)
		subject = "Welcome to Petstore"
		message = f"Hi {user.first_name or user.username},\n\nThank you for registering at Petstore!"
		from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
		try:
			send_mail(subject, message, from_email, [user.email], fail_silently=False)
		except Exception:
			logger.exception('Failed to send welcome email')

		# Return created username and role for client-side convenience
		user_role = role
		# If profile exists, prefer stored value
		try:
			user_role = user.profile.role
		except Exception:
			pass

		return Response({'detail': 'Account created', 'username': user.username, 'role': user_role}, status=status.HTTP_201_CREATED)


class ProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		data = {'username': user.username, 'email': user.email}
		# include profile picture URL if available
		try:
			profile = user.profile
			if profile and getattr(profile, 'profile_picture', None):
				# build absolute url
				pic_url = request.build_absolute_uri(profile.profile_picture.url)
				data['profile_picture'] = pic_url
			else:
				data['profile_picture'] = None
			# include role if present
			data['role'] = getattr(profile, 'role', 'user')
		except Exception:
			data['profile_picture'] = None
			data['role'] = 'user'
		return Response(data)

	def put(self, request):
		user = request.user
		# Accept both JSON and multipart/form-data (with files)
		serializer = ProfileSerializer(data=request.data, context={'user': user})
		if not serializer.is_valid():
			return Response({'detail': 'Update failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		serializer.update(user, serializer.validated_data)

		# Handle profile picture upload
		try:
			profile = user.profile
		except Exception:
			profile = None

		file = request.FILES.get('profile_picture')
		if file:
			if not profile:
				from .models import Profile
				profile = Profile.objects.create(user=user, role='user')
			profile.profile_picture = file
			profile.save()

		# return updated profile info including picture url
		resp = {'detail': 'Profile updated'}
		if profile and getattr(profile, 'profile_picture', None):
			resp['profile_picture'] = request.build_absolute_uri(profile.profile_picture.url)
		return Response(resp)
