import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaBoxOpen, FaClipboardList, FaBox, FaClock } from 'react-icons/fa';

export default function ManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div className="p-8">You must be signed in to view this page.</div>;
  if ((user.role || '').toLowerCase() !== 'admin') return <div className="p-8">Unauthorized — admin access only.</div>;

  const adminModules = [
    {
      title: 'Point of Sale (POS)',
      description: 'Manage sales transactions, process customer payments, and view sales history',
      icon: <FaBoxOpen size={40} />,
      path: '/admin/sales',
      className: 'bg-gradient-to-r from-secondary to-orange-500 text-white'
    },
    {
      title: 'Appointments',
      description: 'View and manage customer appointments and payment processing',
      icon: <FaClock size={40} />,
      path: '/admin/appointments',
      className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    },
    {
      title: 'Inventory',
      description: 'Manage products, stock levels, and inventory adjustments',
      icon: <FaBox size={40} />,
      path: '/admin/inventory',
      className: 'bg-gradient-to-r from-green-500 to-green-600 text-white'
    },
    {
      title: 'End of Day Reports',
      description: 'View daily sales summaries and operational reports',
      icon: <FaClipboardList size={40} />,
      path: '/admin/end-of-day-reports',
      className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-primary-darker py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-accent-cream mb-8">Manage your business operations efficiently</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminModules.map((module, index) => (
            <button
              key={index}
              onClick={() => navigate(module.path)}
              className={`${module.className} rounded-3xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105 text-left group`}
            >
              <div className="mb-4 group-hover:scale-110 transition-transform">
                {module.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{module.title}</h3>
              <p className="text-sm opacity-90">{module.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
