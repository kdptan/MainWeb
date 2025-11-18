from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from datetime import datetime, timedelta, time
from .models import Appointment, AppointmentFeedback
from services.models import Service
from pets.models import PetProfile
from .serializers import AppointmentSerializer, CreateAppointmentSerializer, AppointmentFeedbackSerializer


class CreateAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateAppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Get service
        try:
            service = Service.objects.get(id=validated_data['service'])
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get pet if provided
        pet = None
        if validated_data.get('pet'):
            try:
                pet = PetProfile.objects.get(id=validated_data['pet'], owner=request.user)
            except PetProfile.DoesNotExist:
                return Response({'error': 'Pet not found or does not belong to you'}, status=status.HTTP_404_NOT_FOUND)
        
        # Calculate end time
        start_datetime = datetime.combine(validated_data['appointment_date'], validated_data['start_time'])
        end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
        end_time = end_datetime.time()
        
        # Validate business hours (8 AM - 5 PM)
        business_start = time(8, 0)
        business_end = time(17, 0)
        
        if validated_data['start_time'] < business_start or end_time > business_end:
            return Response({
                'error': f'Appointment must be between 8:00 AM and 5:00 PM. Your selected time would end at {end_time.strftime("%I:%M %p")}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for overlapping appointments only if service doesn't allow overlap
        if not service.may_overlap:
            overlapping = Appointment.objects.filter(
                branch=validated_data['branch'],
                appointment_date=validated_data['appointment_date'],
                status__in=['pending', 'confirmed']
            ).filter(
                Q(start_time__lt=end_time) & Q(end_time__gt=validated_data['start_time'])
            ).exclude(
                # Exclude appointments with services that allow overlap
                service__may_overlap=True
            )
            
            if overlapping.exists():
                return Response({
                    'error': 'This time slot is already booked. Please choose another time.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create appointment
        appointment = Appointment.objects.create(
            user=request.user,
            service=service,
            pet=pet,
            branch=validated_data['branch'],
            appointment_date=validated_data['appointment_date'],
            start_time=validated_data['start_time'],
            end_time=end_time,
            notes=validated_data.get('notes', ''),
            status='pending',
            amount_paid=validated_data.get('amount_paid'),
            change=validated_data.get('change')
        )
        
        # Add add-ons if provided
        add_ons_ids = validated_data.get('add_ons', [])
        if add_ons_ids:
            add_ons = Service.objects.filter(id__in=add_ons_ids, is_solo=True)
            appointment.add_ons.set(add_ons)
        
        appointment_serializer = AppointmentSerializer(appointment)
        return Response(appointment_serializer.data, status=status.HTTP_201_CREATED)


class AppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users see only their own appointments
        queryset = Appointment.objects.filter(user=self.request.user).select_related('service', 'pet').prefetch_related('add_ons')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class AdminAppointmentListView(generics.ListAPIView):
    """Admin can see all appointments"""
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = Appointment.objects.all().select_related('user', 'service', 'pet').prefetch_related('add_ons')
        
        # Filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(branch=branch_filter)
        
        date_filter = self.request.query_params.get('date')
        if date_filter:
            queryset = queryset.filter(appointment_date=date_filter)
        
        return queryset


class AppointmentDetailView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own appointments
        return Appointment.objects.filter(user=self.request.user).select_related('service', 'pet').prefetch_related('add_ons')


class UpdateAppointmentStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(id=pk, user=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        new_status = request.data.get('status')
        
        # Users can only cancel their own pending appointments
        if new_status == 'cancelled' and appointment.status == 'pending':
            appointment.status = 'cancelled'
            appointment.save()
            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data)
        
        return Response({'error': 'You can only cancel pending appointments'}, status=status.HTTP_403_FORBIDDEN)


class AdminUpdateAppointmentStatusView(APIView):
    """Admin can update any appointment status"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(id=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        new_status = request.data.get('status')
        
        if new_status not in ['pending', 'confirmed', 'completed', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.status = new_status
        
        # Update payment information if provided
        if 'amount_paid' in request.data:
            try:
                appointment.amount_paid = request.data.get('amount_paid')
            except (ValueError, TypeError):
                return Response({'error': 'Invalid amount_paid value'}, status=status.HTTP_400_BAD_REQUEST)
        
        if 'change' in request.data:
            try:
                appointment.change = request.data.get('change')
            except (ValueError, TypeError):
                return Response({'error': 'Invalid change value'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.save()
        
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)


class AvailableTimeSlotsView(APIView):
    """Get available time slots for a specific date, branch, and service"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        date_str = request.query_params.get('date')
        branch = request.query_params.get('branch')
        service_id = request.query_params.get('service')
        
        if not all([date_str, branch, service_id]):
            return Response({'error': 'date, branch, and service are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            service = Service.objects.get(id=service_id)
        except (ValueError, Service.DoesNotExist):
            return Response({'error': 'Invalid date or service'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Business hours: 8 AM - 5 PM
        business_start = time(8, 0)
        business_end = time(17, 0)
        
        # Get all booked appointments for that day (exclude overlapping services)
        booked_appointments = Appointment.objects.filter(
            branch=branch,
            appointment_date=appointment_date,
            status__in=['pending', 'confirmed'],
            service__may_overlap=False  # Only consider non-overlapping services as blocking
        ).order_by('start_time')
        
        # Generate all possible time slots (every 30 minutes)
        available_slots = []
        current_time = datetime.combine(appointment_date, business_start)
        end_of_day = datetime.combine(appointment_date, business_end)
        
        while current_time < end_of_day:
            slot_start = current_time.time()
            slot_end = (current_time + timedelta(minutes=service.duration_minutes)).time()
            
            # Check if slot end time is within business hours
            if slot_end > business_end:
                break
            
            # If service allows overlap, always show as available (within business hours)
            if service.may_overlap:
                is_available = True
            else:
                # Check if this slot overlaps with any booked non-overlapping appointment
                is_available = True
                for appointment in booked_appointments:
                    if (slot_start < appointment.end_time and slot_end > appointment.start_time):
                        is_available = False
                        break
            
            if is_available:
                available_slots.append({
                    'start_time': slot_start.strftime('%H:%M'),
                    'end_time': slot_end.strftime('%H:%M'),
                    'display': f"{slot_start.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}"
                })
            
            # Move to next 30-minute slot
            current_time += timedelta(minutes=30)
        
        return Response({
            'date': date_str,
            'branch': branch,
            'service': service.service_name,
            'duration_minutes': service.duration_minutes,
            'may_overlap': service.may_overlap,
            'available_slots': available_slots
        })


class CreateAppointmentFeedbackView(APIView):
    """Create feedback for a completed appointment"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Verify appointment exists and belongs to user
        appointment_id = request.data.get('appointment')
        
        if not appointment_id:
            return Response({'error': 'appointment is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            appointment = Appointment.objects.get(id=appointment_id, user=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found or does not belong to you'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if appointment is completed
        if appointment.status != 'completed':
            return Response({'error': 'Can only leave feedback for completed appointments'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if feedback already exists
        if hasattr(appointment, 'feedback'):
            return Response({'error': 'Feedback already exists for this appointment'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create feedback
        serializer = AppointmentFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer.save(user=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AppointmentFeedbackListView(generics.ListAPIView):
    """List all appointment feedbacks (public)"""
    serializer_class = AppointmentFeedbackSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return AppointmentFeedback.objects.all().select_related('user', 'appointment__service')

