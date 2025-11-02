from django.urls import path
from .views import (
    CreateAppointmentView,
    AppointmentListView,
    AdminAppointmentListView,
    AppointmentDetailView,
    UpdateAppointmentStatusView,
    AdminUpdateAppointmentStatusView,
    AvailableTimeSlotsView
)

urlpatterns = [
    path('', AppointmentListView.as_view(), name='appointment-list'),
    path('admin/all/', AdminAppointmentListView.as_view(), name='admin-appointment-list'),
    path('create/', CreateAppointmentView.as_view(), name='appointment-create'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('<int:pk>/status/', UpdateAppointmentStatusView.as_view(), name='appointment-update-status'),
    path('admin/<int:pk>/status/', AdminUpdateAppointmentStatusView.as_view(), name='admin-appointment-update-status'),
    path('available-slots/', AvailableTimeSlotsView.as_view(), name='available-time-slots'),
]
