import { API_BASE_URL } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access'); // Changed from 'token' to 'access'
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/orders/create/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Failed to create order');
      error.response = { data: errorData };
      throw error;
    }
    
    return await response.json();
  },

  // Get all orders (admin gets all, users get their own)
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.branch) params.append('branch', filters.branch);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/orders/?${queryString}` : `${API_BASE_URL}/orders/`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return await response.json();
  },

  // Admin: Get ALL orders from all users
  getAllOrdersAdmin: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.user) params.append('user', filters.user);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/orders/admin/all/?${queryString}` : `${API_BASE_URL}/orders/admin/all/`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin orders');
    }
    
    return await response.json();
  },

  // Get single order details
  getOrder: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return await response.json();
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    
    return await response.json();
  },

  // Admin: Update order status (mark as completed/cancelled)
  adminUpdateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update order status');
    }
    
    return await response.json();
  },

  // ============================================
  // PURCHASE FEEDBACK (Admin Access Only)
  // Overall order/purchase experience feedback
  // ============================================
  
  // Create purchase feedback for a completed order
  createFeedback: async (feedbackData) => {
    const response = await fetch(`${API_BASE_URL}/orders/feedback/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Failed to create feedback');
      error.response = { data: errorData };
      throw error;
    }
    
    return await response.json();
  },

  // Get all purchase feedback (admin only)
  getAllFeedback: async () => {
    const response = await fetch(`${API_BASE_URL}/orders/feedback/list/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch feedback');
    }
    
    return await response.json();
  },

  // ============================================
  // PRODUCT FEEDBACK (Public Display)
  // Individual product reviews shown on products page
  // ============================================
  
  // Create product feedback
  createProductFeedback: async (feedbackData) => {
    const response = await fetch(`${API_BASE_URL}/orders/product-feedback/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Failed to create product feedback');
      error.response = { data: errorData };
      throw error;
    }
    
    return await response.json();
  },

  // Get all feedback for a specific product
  getProductFeedback: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/orders/product-feedback/${productId}/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch product feedback');
    }
    
    return await response.json();
  },

  // Get ratings for all products
  getProductRatings: async () => {
    const response = await fetch(`${API_BASE_URL}/orders/product-ratings/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch product ratings');
    }
    
    return await response.json();
  },
};

