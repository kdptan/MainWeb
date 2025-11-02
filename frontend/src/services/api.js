// Centralized API configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper function to get auth headers
export const getAuthHeaders = (token) => {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to handle API responses
export const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json();
};

export { API_BASE_URL };
