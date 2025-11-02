import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaTimes, FaCheckCircle, FaBan } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import PetAvatar from '../components/PetAvatar';
import GenderIcon from '../components/GenderIcon';
import { formatAge } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, appointmentId: null });

  useEffect(() => {
    // Wait for auth to settle
    const hasToken = localStorage.getItem('access');
    if (!user && hasToken) {
      return;
    }

    if (!user) {
      toast.showToast('Please login to view appointments', 'error');
      navigate('/');
      return;
    }

    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await appointmentService.getAppointments(filters);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.showToast('Failed to load appointments', 'error');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      await appointmentService.updateAppointmentStatus(confirmDialog.appointmentId, 'cancelled');
      toast.showToast('Appointment cancelled successfully', 'success');
      setConfirmDialog({ isOpen: false, appointmentId: null });
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.showToast('Failed to cancel appointment', 'error');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaCheckCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: FaBan }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const upcomingAppointments = appointments.filter(
    apt => ['pending', 'confirmed'].includes(apt.status)
  );

  const pastAppointments = appointments.filter(
    apt => ['completed', 'cancelled'].includes(apt.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toast {...toast} />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-2">View and manage your appointment bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            {(statusFilter === 'all' || ['pending', 'confirmed'].includes(statusFilter)) && upcomingAppointments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{appointment.service_details?.service_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{appointment.service_details?.description}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaCalendar className="text-blue-600" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaClock className="text-blue-600" />
                          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                          <span className="text-sm text-gray-500">({formatDuration(appointment.duration_minutes)})</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaMapMarkerAlt className="text-blue-600" />
                          <span>{appointment.branch} Branch</span>
                        </div>
                      </div>

                      {appointment.pet_details && (
                        <div className="border-t pt-4 mb-4">
                          <div className="flex items-center gap-3">
                            <PetAvatar imageUrl={appointment.pet_details.pet_picture} size="small" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{appointment.pet_details.pet_name}</span>
                                <GenderIcon gender={appointment.pet_details.gender} size={14} />
                              </div>
                              <p className="text-sm text-gray-600">
                                {appointment.pet_details.breed} • {formatAge(appointment.pet_details.age_value, appointment.pet_details.age_unit)} • {appointment.pet_details.weight_lbs} lbs
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="bg-gray-50 rounded p-3 mb-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </p>
                        </div>
                      )}

                      {appointment.status === 'pending' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setConfirmDialog({ isOpen: true, appointmentId: appointment.id })}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          >
                            <FaTimes />
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {(statusFilter === 'all' || ['completed', 'cancelled'].includes(statusFilter)) && pastAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Appointments</h2>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6 opacity-90">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{appointment.service_details?.service_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{appointment.service_details?.description}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaCalendar className="text-gray-400" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaClock className="text-gray-400" />
                          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span>{appointment.branch} Branch</span>
                        </div>
                      </div>

                      {appointment.pet_details && (
                        <div className="border-t pt-4 mt-4">
                          <div className="flex items-center gap-3">
                            <PetAvatar imageUrl={appointment.pet_details.pet_picture} size="small" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{appointment.pet_details.pet_name}</span>
                                <GenderIcon gender={appointment.pet_details.gender} size={14} />
                              </div>
                              <p className="text-sm text-gray-600">
                                {appointment.pet_details.breed}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {appointments.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FaCalendar className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Appointments Found</h3>
                <p className="text-gray-600 mb-6">You haven't booked any appointments yet.</p>
                <button
                  onClick={() => navigate('/appointment')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Book an Appointment
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        onConfirm={handleCancelAppointment}
        onCancel={() => setConfirmDialog({ isOpen: false, appointmentId: null })}
      />
    </div>
  );
}
