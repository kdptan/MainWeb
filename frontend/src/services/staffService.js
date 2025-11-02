import { API_BASE_URL, getAuthHeaders, handleResponse } from './api';

// Fetch all staff members
export const fetchStaff = async (token) => {
  const response = await fetch(`${API_BASE_URL}/staff/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Update staff location
export const updateStaffLocation = async (userId, location, token) => {
  const response = await fetch(`${API_BASE_URL}/staff/${userId}/location/`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ location }),
  });
  return handleResponse(response);
};
