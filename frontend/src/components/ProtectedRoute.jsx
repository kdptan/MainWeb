import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * 
 * @param {React.ReactNode} children - The component to render if authenticated
 * @param {boolean} adminOnly - If true, only admins can access (default: false)
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useAuth();

  // Still loading auth
  if (user === null && token) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-lighter"></div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/signin" replace />;
  }

  // Admin-only route
  if (adminOnly && !user.is_staff) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
