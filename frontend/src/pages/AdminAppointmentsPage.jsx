import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaCheckCircle, FaBan, FaUser, FaReceipt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import PetAvatar from '../components/PetAvatar';
import GenderIcon from '../components/GenderIcon';
import { formatAge } from '../utils/formatters';
import AppointmentPaymentModal from '../components/AppointmentPaymentModal';
import AppointmentReceiptModal from '../components/AppointmentReceiptModal';

export default function AdminAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('upcoming'); // upcoming, all
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentAppointment, setSelectedPaymentAppointment] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptAppointment, setSelectedReceiptAppointment] = useState(null);

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

    if (!user.is_staff) {
      toast.showToast('Access denied. Admin only.', 'error');
      navigate('/');
      return;
    }

    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter, branchFilter, dateFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const filters = {};
      
      if (statusFilter === 'upcoming') {
        // Fetch pending and confirmed only
        const pendingData = await appointmentService.getAllAppointmentsAdmin({ status: 'pending' });
        const confirmedData = await appointmentService.getAllAppointmentsAdmin({ status: 'confirmed' });
        const combined = [...(Array.isArray(pendingData) ? pendingData : []), ...(Array.isArray(confirmedData) ? confirmedData : [])];
        
        // Apply additional filters
        let filtered = combined;
        if (branchFilter !== 'all') {
          filtered = filtered.filter(apt => apt.branch === branchFilter);
        }
        if (dateFilter) {
          // Filter by month (YYYY-MM format)
          filtered = filtered.filter(apt => {
            const appointmentMonth = apt.appointment_date.substring(0, 7); // Get YYYY-MM from YYYY-MM-DD
            return appointmentMonth === dateFilter;
          });
        }
        
        // Sort by date and time
        filtered.sort((a, b) => {
          const dateCompare = new Date(a.appointment_date) - new Date(b.appointment_date);
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        });
        
        setAppointments(filtered);
      } else {
        // Fetch all appointments
        if (branchFilter !== 'all') filters.branch = branchFilter;
        if (dateFilter) {
          // Note: Backend will need to be updated to handle month filtering
          // For now, we'll fetch all and filter on frontend
          const data = await appointmentService.getAllAppointmentsAdmin(filters);
          let allAppts = Array.isArray(data) ? data : [];
          
          // Filter by month
          allAppts = allAppts.filter(apt => {
            const appointmentMonth = apt.appointment_date.substring(0, 7);
            return appointmentMonth === dateFilter;
          });
          
          setAppointments(allAppts);
        } else {
          const data = await appointmentService.getAllAppointmentsAdmin(filters);
          setAppointments(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.showToast('Failed to load appointments', 'error');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (transaction) => {
    try {
      // Update appointment status to completed with payment information
      await appointmentService.adminUpdateAppointmentStatus(
        selectedPaymentAppointment.id, 
        'completed',
        {
          amount_paid: transaction.amountPaid,
          change: transaction.change
        }
      );
      
      // Store payment data in sessionStorage for immediate display in receipt
      const paymentDataMap = JSON.parse(sessionStorage.getItem('appointmentPaymentData') || '{}');
      paymentDataMap[selectedPaymentAppointment.id] = {
        amount_paid: transaction.amountPaid,
        change: transaction.change
      };
      sessionStorage.setItem('appointmentPaymentData', JSON.stringify(paymentDataMap));
      
      // Transaction is already stored in localStorage by AppointmentPaymentModal
      // Now we close the modal and refresh
      toast.showToast('Payment completed and appointment marked as complete!', 'success');
      setPaymentModalOpen(false);
      setSelectedPaymentAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.showToast('Payment recorded but there was an error', 'error');
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

  return (
    <div className="min-h-screen bg-primary-darker py-8 px-4 sm:px-6 lg:px-8">
      <Toast {...toast} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/appointment')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-light transition-colors"
          >
            ← Back to Appointments
          </button>
          <h1 className="heading-main text-accent-cream">All Appointments (Admin)</h1>
          <p className="text-white mt-2">Manage all customer appointments</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-300 shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="upcoming" className="bg-white text-gray-900">Upcoming Only</option>
                <option value="all" className="bg-white text-gray-900">All Appointments</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="all" className="bg-white text-gray-900">All Branches</option>
                <option value="Matina" className="bg-white text-gray-900">Matina</option>
                <option value="Toril" className="bg-white text-gray-900">Toril</option>
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setBranchFilter('all');
                  setDateFilter('');
                  setStatusFilter('upcoming');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 border border-gray-300 font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-secondary/20 p-12 text-center">
            <FaCalendar className="mx-auto text-secondary/50 mb-4" size={64} />
            <h3 className="text-xl font-bold text-accent-cream mb-2">No Appointments Found</h3>
            <p className="text-gray-400">No appointments match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{appointment.service_details?.service_name}</h3>
                      {appointment.service_details?.may_overlap && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          May Overlap
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{appointment.service_details?.description}</p>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                {/* Customer Info */}
                <div className="bg-secondary/5 rounded-lg p-4 mb-4 border border-secondary/10">
                  <div className="flex items-center gap-2 text-gray-900">
                    <FaUser className="text-secondary" />
                    <span className="font-medium">Customer:</span>
                    <span>{appointment.user_details?.username || 'N/A'}</span>
                    {appointment.user_details?.email && (
                      <span className="text-sm text-gray-600">({appointment.user_details.email})</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaCalendar className="text-secondary" />
                    <span>{formatDate(appointment.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaClock className="text-secondary" />
                    <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                    <span className="text-sm text-gray-500">({formatDuration(appointment.duration_minutes)})</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaMapMarkerAlt className="text-secondary" />
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
                  <div className="bg-secondary/5 rounded p-3 mb-4 border border-secondary/10">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </p>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => {
                        // Directly set appointment for payment without confirmation dialog
                        setSelectedPaymentAppointment(appointment);
                        setPaymentModalOpen(true);
                      }}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-orange-500 flex items-center gap-2"
                    >
                      <FaCheckCircle />
                      Complete Payment
                    </button>
                  )}
                  {appointment.status === 'completed' && (
                    <button
                      onClick={() => {
                        // Merge stored payment data with appointment for receipt display
                        const paymentDataMap = JSON.parse(sessionStorage.getItem('appointmentPaymentData') || '{}');
                        const paymentData = paymentDataMap[appointment.id];
                        const appointmentWithPayment = paymentData 
                          ? { ...appointment, ...paymentData }
                          : appointment;
                        setSelectedReceiptAppointment(appointmentWithPayment);
                        setReceiptModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <FaReceipt />
                      View Receipt
                    </button>
                  )}
                  {(appointment.status === 'cancelled') && (
                    <span className="text-sm text-gray-500 italic">No actions available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AppointmentPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPaymentAppointment(null);
        }}
        appointment={selectedPaymentAppointment}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Receipt Modal */}
      <AppointmentReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedReceiptAppointment(null);
        }}
        appointment={selectedReceiptAppointment}
      />

      <Toast {...toast} />
    </div>
  );
}
