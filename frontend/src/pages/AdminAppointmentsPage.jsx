import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaCheckCircle, FaBan, FaUser } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import PetAvatar from '../components/PetAvatar';
import GenderIcon from '../components/GenderIcon';
import { formatAge } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('upcoming'); // upcoming, all
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, appointmentId: null, action: '', newStatus: '' });

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

  const handleUpdateStatus = async () => {
    try {
      await appointmentService.adminUpdateAppointmentStatus(confirmDialog.appointmentId, confirmDialog.newStatus);
      toast.showToast(`Appointment ${confirmDialog.action} successfully`, 'success');
      setConfirmDialog({ isOpen: false, appointmentId: null, action: '', newStatus: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.showToast('Failed to update appointment', 'error');
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toast {...toast} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/appointment')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Appointments
          </button>
          <h1 className="text-3xl font-bold text-gray-900">All Appointments (Admin)</h1>
          <p className="text-gray-600 mt-2">Manage all customer appointments</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="upcoming">Upcoming Only</option>
                <option value="all">All Appointments</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Branches</option>
                <option value="Matina">Matina</option>
                <option value="Toril">Toril</option>
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaCalendar className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600">No appointments match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-900">
                    <FaUser className="text-blue-600" />
                    <span className="font-medium">Customer:</span>
                    <span>{appointment.user_details?.username || 'N/A'}</span>
                    {appointment.user_details?.email && (
                      <span className="text-sm text-gray-600">({appointment.user_details.email})</span>
                    )}
                  </div>
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

                {/* Admin Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setConfirmDialog({ 
                          isOpen: true, 
                          appointmentId: appointment.id, 
                          action: 'confirmed',
                          newStatus: 'confirmed'
                        })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FaCheckCircle />
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ 
                          isOpen: true, 
                          appointmentId: appointment.id, 
                          action: 'cancelled',
                          newStatus: 'cancelled'
                        })}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <FaBan />
                        Cancel
                      </button>
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => setConfirmDialog({ 
                          isOpen: true, 
                          appointmentId: appointment.id, 
                          action: 'completed',
                          newStatus: 'completed'
                        })}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <FaCheckCircle />
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ 
                          isOpen: true, 
                          appointmentId: appointment.id, 
                          action: 'cancelled',
                          newStatus: 'cancelled'
                        })}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <FaBan />
                        Cancel
                      </button>
                    </>
                  )}
                  {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                    <span className="text-sm text-gray-500 italic">No actions available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={`${confirmDialog.action.charAt(0).toUpperCase() + confirmDialog.action.slice(1)} Appointment`}
        message={`Are you sure you want to mark this appointment as ${confirmDialog.action}?`}
        onConfirm={handleUpdateStatus}
        onCancel={() => setConfirmDialog({ isOpen: false, appointmentId: null, action: '', newStatus: '' })}
      />
    </div>
  );
}
