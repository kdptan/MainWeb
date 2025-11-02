import { API_BASE_URL, getAuthHeaders, handleResponse } from './api';

// Fetch all pets
export const fetchPets = async (token) => {
  const response = await fetch(`${API_BASE_URL}/pets/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Fetch normal users (non-admin)
export const fetchNormalUsers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/users/normal/`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(response);
};

// Create new pet
export const createPet = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/pets/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: formData,
  });
  return handleResponse(response);
};

// Update pet
export const updatePet = async (id, formData, token) => {
  const response = await fetch(`${API_BASE_URL}/pets/${id}/`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(response);
};

// Delete pet
export const deletePet = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/pets/${id}/`, {
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
