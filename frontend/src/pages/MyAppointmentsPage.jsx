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
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const appointmentsPerPage = 4; // 2 per column x 2 columns

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

  // Reset pagination when status filter changes
  useEffect(() => {
    setUpcomingPage(1);
    setPastPage(1);
  }, [statusFilter]);

  // Pagination calculations
  const totalUpcomingPages = Math.ceil(upcomingAppointments.length / appointmentsPerPage);
  const totalPastPages = Math.ceil(pastAppointments.length / appointmentsPerPage);
  
  const paginatedUpcoming = upcomingAppointments.slice(
    (upcomingPage - 1) * appointmentsPerPage,
    upcomingPage * appointmentsPerPage
  );
  
  const paginatedPast = pastAppointments.slice(
    (pastPage - 1) * appointmentsPerPage,
    pastPage * appointmentsPerPage
  );

  return (
    <div className="min-h-screen bg-primary-darker py-8 px-4 sm:px-6 lg:px-8">
      <Toast {...toast} />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 font-medium px-4 py-2 rounded-3xl bg-secondary text-white hover:bg-orange-500 transition-colors shadow-md"
          >
            ← Back to Home
          </button>
          <h1 className="display-md text-accent-cream mb-2">My Appointments</h1>
          <p className="text-white">View and manage your appointment bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-3xl shadow-md p-4 mb-6 border border-secondary">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-3xl transition-all font-medium ${
                statusFilter === 'all'
                  ? 'bg-secondary text-white shadow-lg'
                  : 'bg-gray-100 text-chonky-poop hover:bg-gray-200 border border-secondary'
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-3xl transition-all font-medium ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500 text-white shadow-lg'
                  : 'bg-gray-100 text-chonky-poop hover:bg-gray-200 border border-secondary'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-3xl transition-all font-medium ${
                statusFilter === 'confirmed'
                  ? 'bg-secondary text-white shadow-lg'
                  : 'bg-gray-100 text-chonky-poop hover:bg-gray-200 border border-secondary'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-3xl transition-all font-medium ${
                statusFilter === 'completed'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-chonky-poop hover:bg-gray-200 border border-secondary'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-3xl transition-all font-medium ${
                statusFilter === 'cancelled'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-chonky-poop hover:bg-gray-200 border border-secondary'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            {(statusFilter === 'all' || ['pending', 'confirmed'].includes(statusFilter)) && upcomingAppointments.length > 0 && (
              <div className="mb-8">
                <h2 className="heading-main text-accent-cream mb-4">Upcoming Appointments</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {paginatedUpcoming.map((appointment) => (
                    <div key={appointment.id} className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow border border-secondary">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="heading-card text-chonky-brown">{appointment.service_details?.service_name}</h3>
                          <p className="text-sm text-chonky-poop mt-1">{appointment.service_details?.description}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-chonky-brown">
                          <FaCalendar className="text-chonky-khaki" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-chonky-brown">
                          <FaClock className="text-chonky-khaki" />
                          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                          <span className="text-sm text-gray-600">({formatDuration(appointment.duration_minutes)})</span>
                        </div>
                        <div className="flex items-center gap-2 text-chonky-brown">
                          <FaMapMarkerAlt className="text-chonky-khaki" />
                          <span>{appointment.branch} Branch</span>
                        </div>
                      </div>

                      {appointment.pet_details && (
                        <div className="border-t border-secondary pt-4 mb-4">
                          <div className="flex items-center gap-3">
                            <PetAvatar imageUrl={appointment.pet_details.pet_picture} size="small" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-chonky-brown">{appointment.pet_details.pet_name}</span>
                                <GenderIcon gender={appointment.pet_details.gender} size={14} />
                              </div>
                              <p className="text-sm text-chonky-poop">
                                {appointment.pet_details.breed} • {formatAge(appointment.pet_details.age_value, appointment.pet_details.age_unit)} • {appointment.pet_details.weight_lbs} lbs
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="bg-gray-100 rounded p-3 mb-4 border border-secondary">
                          <p className="text-sm text-chonky-brown">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </p>
                        </div>
                      )}

                      {appointment.status === 'pending' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setConfirmDialog({ isOpen: true, appointmentId: appointment.id })}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-3xl flex items-center gap-2 transition-colors font-medium"
                          >
                            <FaTimes />
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Upcoming Appointments Pagination */}
                {totalUpcomingPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setUpcomingPage(prev => Math.max(prev - 1, 1))}
                      disabled={upcomingPage === 1}
                      className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalUpcomingPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setUpcomingPage(page)}
                          className={`px-3 py-2 rounded-3xl font-medium transition-colors ${
                            upcomingPage === page
                              ? 'bg-secondary text-white'
                              : 'bg-white text-chonky-brown hover:bg-gray-100 border border-secondary'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setUpcomingPage(prev => Math.min(prev + 1, totalUpcomingPages))}
                      disabled={upcomingPage === totalUpcomingPages}
                      className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Past Appointments */}
            {(statusFilter === 'all' || ['completed', 'cancelled'].includes(statusFilter)) && pastAppointments.length > 0 && (
              <div>
                <h2 className="heading-main text-accent-cream mb-4">Past Appointments</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {paginatedPast.map((appointment) => (
                    <div key={appointment.id} className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow border border-secondary">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="heading-card text-chonky-brown">{appointment.service_details?.service_name}</h3>
                          <p className="text-sm text-chonky-poop mt-1">{appointment.service_details?.description}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-chonky-brown">
                          <FaCalendar className="text-chonky-khaki" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-chonky-brown">
                          <FaClock className="text-chonky-khaki" />
                          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-chonky-brown">
                          <FaMapMarkerAlt className="text-chonky-khaki" />
                          <span>{appointment.branch} Branch</span>
                        </div>
                      </div>

                      {appointment.pet_details && (
                        <div className="border-t border-secondary pt-4 mt-4">
                          <div className="flex items-center gap-3">
                            <PetAvatar imageUrl={appointment.pet_details.pet_picture} size="small" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-chonky-brown">{appointment.pet_details.pet_name}</span>
                                <GenderIcon gender={appointment.pet_details.gender} size={14} />
                              </div>
                              <p className="text-sm text-chonky-poop">
                                {appointment.pet_details.breed}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Past Appointments Pagination */}
                {totalPastPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setPastPage(prev => Math.max(prev - 1, 1))}
                      disabled={pastPage === 1}
                      className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPastPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPastPage(page)}
                          className={`px-3 py-2 rounded-3xl font-medium transition-colors ${
                            pastPage === page
                              ? 'bg-secondary text-white'
                              : 'bg-white text-chonky-brown hover:bg-gray-100 border border-secondary'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setPastPage(prev => Math.min(prev + 1, totalPastPages))}
                      disabled={pastPage === totalPastPages}
                      className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {appointments.length === 0 && !loading && (
              <div className="bg-white rounded-3xl shadow-md p-12 text-center border border-secondary">
                <FaCalendar className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="heading-card text-chonky-brown mb-2">No Appointments Found</h3>
                <p className="text-gray-600 mb-6">You haven't booked any appointments yet.</p>
                <button
                  onClick={() => navigate('/appointment')}
                  className="px-6 py-3 bg-secondary hover:bg-btn-yellow hover:text-chonky-brown text-white rounded-3xl transition-colors font-medium"
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
