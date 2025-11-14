from django.urls import path
from .views import (
    RegisterView, ProfileView, LoginActivityListView, DeactivateUserView, 
    CustomTokenObtainPairView, DeactivatedUsersView, ReactivateUserView,
    StaffListView, UpdateStaffLocationView, PasswordResetRequestView,
    PasswordResetConfirmView, VerifyEmailView
)

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='api-register'),
    path('api/profile/', ProfileView.as_view(), name='api-profile'),
    path('api/login-activities/', LoginActivityListView.as_view(), name='api-login-activities'),
    path('api/deactivate/<int:user_id>/', DeactivateUserView.as_view(), name='api-deactivate-user'),
    path('api/deactivated-users/', DeactivatedUsersView.as_view(), name='api-deactivated-users'),
    path('api/reactivate/<int:user_id>/', ReactivateUserView.as_view(), name='api-reactivate-user'),
    path('api/staff/', StaffListView.as_view(), name='api-staff-list'),
    path('api/staff/<int:user_id>/location/', UpdateStaffLocationView.as_view(), name='api-update-staff-location'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/password-reset/', PasswordResetRequestView.as_view(), name='api-password-reset'),
    path('api/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='api-password-reset-confirm'),
    path('api/verify-email/', VerifyEmailView.as_view(), name='api-verify-email'),
]

