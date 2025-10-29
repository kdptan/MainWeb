import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ManagementPage() {
  const { user } = useAuth();

  if (!user) return <div className="p-8">You must be signed in to view this page.</div>;
  if ((user.role || '').toLowerCase() !== 'admin') return <div className="p-8">Unauthorized — admin access only.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Management</h1>
      <p className="text-gray-700">Welcome to the admin management area. Add admin tools here.</p>
    </div>
  );
}
