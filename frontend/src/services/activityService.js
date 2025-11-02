import { API_BASE_URL, getAuthHeaders, handleResponse } from './api';

// Fetch login activities with pagination
export const fetchLoginActivities = async (page, token) => {
  const response = await fetch(`${API_BASE_URL}/login-activities/?page=${page}`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Deactivate user account
export const deactivateUser = async (userId, token) => {
  const response = await fetch(`${API_BASE_URL}/deactivate/${userId}/`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Fetch deactivated users
export const fetchDeactivatedUsers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/deactivated-users/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Reactivate user account
export const reactivateUser = async (userId, token) => {
  const response = await fetch(`${API_BASE_URL}/reactivate/${userId}/`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};
