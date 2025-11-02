import { API_BASE_URL, getAuthHeaders, handleResponse } from './api';

// Fetch products
export const fetchProducts = async (branch, token) => {
  const url = branch
    ? `${API_BASE_URL}/inventory/products/?branch=${encodeURIComponent(branch)}`
    : `${API_BASE_URL}/inventory/products/`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Create products (batch)
export const createProducts = async (productsData, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(productsData),
  });
  return handleResponse(response);
};

// Update product field
export const updateProductField = async (id, fieldData, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/products/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(fieldData),
  });
  return handleResponse(response);
};

// Delete product
export const deleteProduct = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/products/${id}/`, {
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

// Fetch audit logs
export const fetchAuditLogs = async (token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/audit-logs/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Create audit log
export const createAuditLog = async (logData, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/audit-logs/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(logData),
  });
  return handleResponse(response);
};
