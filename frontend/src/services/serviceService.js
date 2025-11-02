import { API_BASE_URL, getAuthHeaders, handleResponse } from './api';

// Fetch all services
export const fetchServices = async (token) => {
  const response = await fetch(`${API_BASE_URL}/services/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Create service
export const createService = async (serviceData, token) => {
  const response = await fetch(`${API_BASE_URL}/services/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(serviceData),
  });
  return handleResponse(response);
};

// Update service
export const updateService = async (id, serviceData, token) => {
  const response = await fetch(`${API_BASE_URL}/services/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(serviceData),
  });
  return handleResponse(response);
};

// Delete service
export const deleteService = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/services/${id}/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return true;
};
