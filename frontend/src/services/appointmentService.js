import { API_BASE_URL } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access') || sessionStorage.getItem('access');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const appointmentService = {
  // Create a new appointment
  createAppointment: async (appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/create/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Failed to create appointment');
      error.response = { data: errorData };
      throw error;
    }
    
    return await response.json();
  },

  // Get user's appointments
  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/appointments/?${queryString}` : `${API_BASE_URL}/appointments/`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }
    
    return await response.json();
  },

  // Admin: Get all appointments
  getAllAppointmentsAdmin: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.date) params.append('date', filters.date);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/appointments/admin/all/?${queryString}` : `${API_BASE_URL}/appointments/admin/all/`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin appointments');
    }
    
    return await response.json();
  },

  // Get single appointment details
  getAppointment: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch appointment');
    }
    
    return await response.json();
  },

  // Cancel appointment (user)
  updateAppointmentStatus: async (appointmentId, status) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update appointment status');
    }
    
    return await response.json();
  },

  // Admin: Update appointment status and payment info
  adminUpdateAppointmentStatus: async (appointmentId, status, paymentData = {}) => {
    const body = { status };
    if (paymentData.amount_paid !== undefined) {
      body.amount_paid = paymentData.amount_paid;
    }
    if (paymentData.change !== undefined) {
      body.change = paymentData.change;
    }
    
    const response = await fetch(`${API_BASE_URL}/appointments/admin/${appointmentId}/status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update appointment status');
    }
    
    return await response.json();
  },

  // Get available time slots
  getAvailableSlots: async (date, branch, serviceId) => {
    const params = new URLSearchParams({
      date,
      branch,
      service: serviceId
    });
    
    const response = await fetch(`${API_BASE_URL}/appointments/available-slots/?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch available slots');
    }
    
    return await response.json();
  },

  // Create appointment feedback
  createFeedback: async (feedbackData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/feedback/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit feedback');
    }
    
    return await response.json();
  },

  // Get all appointment feedback (admin only)
  getAllFeedback: async () => {
    const response = await fetch(`${API_BASE_URL}/appointments/feedback/all/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch appointment feedback');
    }
    
    return await response.json();
  },
};
