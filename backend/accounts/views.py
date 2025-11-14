from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import logging
import secrets

from .serializers import RegisterSerializer, ProfileSerializer, LoginActivitySerializer
from .models import LoginActivity, Profile
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
	"""Custom login view that tracks login activity"""
	
	def post(self, request, *args, **kwargs):
		# Get the response from the parent class
		response = super().post(request, *args, **kwargs)
		
		# If login was successful, track the activity
		if response.status_code == 200:
			try:
				# Get the user from the validated credentials
				from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
				serializer = TokenObtainPairSerializer(data=request.data)
				if serializer.is_valid():
					user = serializer.user
					
					# Get client IP address
					x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
					if x_forwarded_for:
						ip_address = x_forwarded_for.split(',')[0]
					else:
						ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
					
					# Get user agent
					user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
					
					# Create login activity record
					LoginActivity.objects.create(
						user=user,
						ip_address=ip_address,
						user_agent=user_agent
					)
					logger.info(f"Login activity tracked for user: {user.username}")
			except Exception as e:
				logger.error(f"Failed to track login activity: {e}")
		
		return response


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
		
		# Set user as inactive until email is verified
		user.is_active = False
		user.save()

		# Generate verification token
		verification_token = secrets.token_urlsafe(32)
		
		# Get or create profile and store verification token
		profile, created = Profile.objects.get_or_create(user=user)
		profile.verification_token = verification_token
		profile.email_verified = False
		profile.save()
		
		# Build verification URL
		verification_url = f"http://localhost:3000/verify-email/{verification_token}"

		# Send verification email
		subject = "Verify Your Email - Chonky Boi Pet Store"
		message = f"""Hi {user.first_name or user.username},

Welcome to Chonky Boi Pet Store!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
Chonky Boi Pet Store Team
"""
		from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
		try:
			send_mail(subject, message, from_email, [user.email], fail_silently=False)
			logger.info(f"Verification email sent to {user.email}")
		except Exception:
			logger.exception('Failed to send verification email')

		# Return created username and role for client-side convenience
		user_role = role
		# If profile exists, prefer stored value
		try:
			user_role = user.profile.role
		except Exception:
			pass

		return Response({
			'detail': 'Account created! Please check your email to verify your account.',
			'username': user.username,
			'role': user_role,
			'email_verification_required': True
		}, status=status.HTTP_201_CREATED)


class ProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		data = {
			'id': user.id,
			'username': user.username,
			'email': user.email,
			'is_staff': user.is_staff,
			'is_superuser': user.is_superuser,
		}
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

class ActivityLogPagination(PageNumberPagination):
	page_size = 15
	max_page_size = 150


class LoginActivityListView(APIView):
	permission_classes = [IsAuthenticated]
	
	def get(self, request):
		user = request.user
		
		# Check if user is admin (same pattern as ProfileView)
		try:
			profile = user.profile
			role = getattr(profile, 'role', 'user')
		except Exception:
			role = 'user'
		
		if not (user.is_staff or user.is_superuser or role == 'admin'):
			return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
			
		# Get all activities ordered by most recent first
		activities = LoginActivity.objects.all().order_by('-login_time')
		serializer = LoginActivitySerializer(activities, many=True)
		
		# Manual pagination
		page = int(request.GET.get('page', 1))
		page_size = 15
		start = (page - 1) * page_size
		end = start + page_size
		
		paginated_data = serializer.data[start:end]
		total_count = len(serializer.data)
		
		return Response({
			'count': total_count,
			'next': None,
			'previous': None,
			'results': paginated_data
		})


class DeactivateUserView(APIView):
	permission_classes = [IsAuthenticated]
	
	def post(self, request, user_id):
		user = request.user
		
		# Check if user is admin (same pattern as ProfileView)
		try:
			profile = user.profile
			role = getattr(profile, 'role', 'user')
		except Exception:
			role = 'user'
		
		if not (user.is_staff or user.is_superuser or role == 'admin'):
			return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
			
		try:
			user_to_deactivate = User.objects.get(id=user_id)
			user_to_deactivate.is_active = False
			user_to_deactivate.save()
			return Response({'detail': 'User deactivated successfully'}, status=status.HTTP_200_OK)
		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class DeactivatedUsersView(APIView):
	permission_classes = [IsAuthenticated]
	
	def get(self, request):
		user = request.user
		
		# Check if user is admin
		try:
			profile = user.profile
			role = getattr(profile, 'role', 'user')
		except Exception:
			role = 'user'
		
		if not (user.is_staff or user.is_superuser or role == 'admin'):
			return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
			
		# Get all deactivated users
		deactivated_users = User.objects.filter(is_active=False)
		users_data = []
		
		for user in deactivated_users:
			user_info = {
				'id': user.id,
				'username': user.username,
				'email': user.email,
				'date_joined': user.date_joined,
				'last_login': user.last_login,
				'role': 'user'
			}
			
			# Get role from profile if exists
			try:
				if hasattr(user, 'profile'):
					user_info['role'] = user.profile.role
			except Exception:
				pass
				
			users_data.append(user_info)
		
		return Response(users_data)


class ReactivateUserView(APIView):
	permission_classes = [IsAuthenticated]
	
	def post(self, request, user_id):
		user = request.user
		
		# Check if user is admin
		try:
			profile = user.profile
			role = getattr(profile, 'role', 'user')
		except Exception:
			role = 'user'
		
		if not (user.is_staff or user.is_superuser or role == 'admin'):
			return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
			
		try:
			user_to_reactivate = User.objects.get(id=user_id)
			user_to_reactivate.is_active = True
			user_to_reactivate.save()
			return Response({'detail': 'User reactivated successfully'}, status=status.HTTP_200_OK)
		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class StaffListView(APIView):
	permission_classes = [IsAuthenticated]
	
	def get(self, request):
		user = request.user
		
		# Check if user is admin
		try:
			profile = user.profile
			role = getattr(profile, 'role', 'user')
		except Exception:
			role = 'user'
		
		if not (user.is_staff or user.is_superuser or role == 'admin'):
			return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
			
		# Get all admin/staff users
		admin_users = User.objects.filter(profile__role='admin') | User.objects.filter(is_staff=True)
		admin_users = admin_users.distinct()
		
		staff_data = []
		for staff_user in admin_users:
			user_info = {
				'id': staff_user.id,
				'username': staff_user.username,
				'email': staff_user.email,
				'location': 'Matina'  # Default
			}
			
			# Get location from profile if exists
			try:
				if hasattr(staff_user, 'profile') and hasattr(staff_user.profile, 'location'):
					user_info['location'] = staff_user.profile.location
			except Exception:
				pass
				
			staff_data.append(user_info)
		
		return Response(staff_data)


class UpdateStaffLocationView(APIView):
	permission_classes = [IsAuthenticated]
	
	def post(self, request, user_id):
		user = request.user
		
		# Check if user is admin
		try:
			profile = user.profile
			role = getattr(profile, 'role', 'user')
		except Exception:
			role = 'user'
		
		if not (user.is_staff or user.is_superuser or role == 'admin'):
			return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
			
		location = request.data.get('location')
		if not location or location not in ['Matina', 'Toril']:
			return Response({'error': 'Invalid location. Must be Matina or Toril'}, status=status.HTTP_400_BAD_REQUEST)
			
		try:
			staff_user = User.objects.get(id=user_id)
			profile, created = Profile.objects.get_or_create(user=staff_user)
			profile.location = location
			profile.save()
			return Response({'detail': 'Location updated successfully', 'location': location}, status=status.HTTP_200_OK)
		except User.DoesNotExist:
			return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetRequestView(APIView):
	"""Request a password reset email"""
	
	def post(self, request):
		email = request.data.get('email')
		
		if not email:
			return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
		
		# Check if user exists with this email
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return Response({'error': 'No account found with this email address. Please check and try again.'}, status=status.HTTP_404_NOT_FOUND)
		
		# Check if user account is active
		if not user.is_active:
			return Response({'error': 'This account has been deactivated. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)
		
		# Generate password reset token
		token = default_token_generator.make_token(user)
		uid = urlsafe_base64_encode(force_bytes(user.pk))
		
		# Build reset URL - use frontend URL
		reset_url = f"http://localhost:3000/reset-password/{uid}/{token}"
		
		# Send email
		subject = "Password Reset Request"
		message = f"""Hi {user.first_name or user.username},

You requested a password reset for your Chonky Boi Pet Store account.

Click the link below to reset your password:
{reset_url}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
Chonky Boi Pet Store Team
"""
		from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@localhost')
		
		try:
			send_mail(subject, message, from_email, [user.email], fail_silently=False)
			logger.info(f"Password reset email sent to {email}")
		except Exception as e:
			logger.exception(f'Failed to send password reset email: {e}')
			return Response({'error': 'Failed to send email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
		# Get profile picture if available
		profile_picture_url = None
		try:
			if hasattr(user, 'profile') and user.profile.profile_picture:
				from django.http import HttpRequest
				request_obj = request._request if hasattr(request, '_request') else request
				profile_picture_url = request_obj.build_absolute_uri(user.profile.profile_picture.url)
		except Exception:
			pass
		
		response_data = {
			'detail': 'Password reset email sent successfully! Check your email for the reset link.',
			'username': user.username,
			'email': user.email,
			'first_name': user.first_name or '',
			'last_name': user.last_name or ''
		}
		
		if profile_picture_url:
			response_data['profile_picture'] = profile_picture_url
		
		return Response(response_data, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
	"""Reset password with token"""
	
	def post(self, request):
		uid = request.data.get('uid')
		token = request.data.get('token')
		new_password = request.data.get('new_password')
		
		if not all([uid, token, new_password]):
			return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
		
		if len(new_password) < 8:
			return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)
		
		try:
			# Decode the user ID
			user_id = force_str(urlsafe_base64_decode(uid))
			user = User.objects.get(pk=user_id)
			
			# Verify the token
			if not default_token_generator.check_token(user, token):
				return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)
			
			# Set the new password
			user.set_password(new_password)
			user.save()
			
			logger.info(f"Password reset successful for user: {user.username}")
			
			return Response({'detail': 'Password has been reset successfully'}, status=status.HTTP_200_OK)
			
		except (TypeError, ValueError, OverflowError, User.DoesNotExist):
			return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
	"""Verify user email with token"""
	
	def post(self, request):
		token = request.data.get('token')
		
		if not token:
			return Response({'error': 'Verification token is required'}, status=status.HTTP_400_BAD_REQUEST)
		
		try:
			# Find profile with this verification token
			profile = Profile.objects.get(verification_token=token)
			user = profile.user
			
			# Check if already verified
			if profile.email_verified:
				return Response({'detail': 'Email already verified. You can now log in.'}, status=status.HTTP_200_OK)
			
			# Verify the email
			profile.email_verified = True
			profile.verification_token = None  # Clear the token
			profile.save()
			
			# Activate the user account
			user.is_active = True
			user.save()
			
			logger.info(f"Email verified for user: {user.username}")
			
			return Response({
				'detail': 'Email verified successfully! You can now log in.',
				'username': user.username
			}, status=status.HTTP_200_OK)
			
		except Profile.DoesNotExist:
			return Response({'error': 'Invalid or expired verification link'}, status=status.HTTP_400_BAD_REQUEST)
