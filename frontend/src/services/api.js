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

// Helper function to refresh token
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      // Clear auth if refresh fails
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      throw new Error('Token refresh failed');
    }

    const data = await res.json();
    const newAccessToken = data.access;

    // Determine storage location
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    if (isRemembered) {
      localStorage.setItem('access', newAccessToken);
      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }
    } else {
      sessionStorage.setItem('access', newAccessToken);
      if (data.refresh) {
        sessionStorage.setItem('refresh', data.refresh);
      }
    }

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Fetch wrapper that handles 401 and token refresh
export const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem('access') || sessionStorage.getItem('access');
  
  if (!token) {
    throw new Error('No access token available');
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If we get 401, try to refresh token and retry once
  if (response.status === 401) {
    console.log('Token expired, attempting refresh...');
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return response;
};

export { API_BASE_URL };
