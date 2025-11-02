import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import { fetchStaff, updateStaffLocation } from '../../services/staffService';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      const data = await fetchStaff(token);
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showToast('Failed to load staff members', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleLocationChange = async (staffId, newLocation) => {
    try {
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      await updateStaffLocation(staffId, newLocation, token);
      showToast('Location updated successfully', 'success');
      loadStaff(); // Refresh the list
    } catch (error) {
      console.error('Error updating location:', error);
      showToast('Failed to update location', 'error');
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-accent-cream">
      <h1 className="text-3xl font-bold text-primary-darker mb-6">Staff Management</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden border-2 border-primary">
            <table className="min-w-full divide-y divide-primary">
              <thead className="bg-accent-peach">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-darker uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-darker uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-accent-peach transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-darker">
                      {staff.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-darker">
                      <select
                        value={staff.location}
                        onChange={(e) => handleLocationChange(staff.id, e.target.value)}
                        className="block w-full px-3 py-2 border-2 border-primary rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary text-primary-darker"
                      >
                        <option value="Matina">Matina</option>
                        <option value="Toril">Toril</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {staffList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No staff members found
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
