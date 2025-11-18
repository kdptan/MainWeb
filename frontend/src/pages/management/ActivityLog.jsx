import React, { useState, useEffect, useCallback } from 'react';
import { FaBan, FaUserCheck } from 'react-icons/fa';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { fetchLoginActivities, deactivateUser, fetchDeactivatedUsers, reactivateUser } from '../../services/activityService';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast, showToast, hideToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [loadingDeactivated, setLoadingDeactivated] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [selectedUserToReactivate, setSelectedUserToReactivate] = useState(null);

  const fetchActivities = useCallback(async (page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      console.log('Fetching activities with token:', token ? 'Token exists' : 'No token');
      const data = await fetchLoginActivities(page, token);
      setActivities(data.results);
      setTotalCount(data.count);
      
      // Calculate total pages with max 10 pages (150 records)
      const maxRecords = 150;
      const recordCount = Math.min(data.count, maxRecords);
      const pages = Math.ceil(recordCount / 15);
      setTotalPages(Math.min(pages, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
      showToast('Failed to load activity log', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage, fetchActivities]);

  const handleDeactivate = (user) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const confirmDeactivate = async () => {
    try {
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      console.log('Deactivating user:', selectedUser);
      console.log('User ID:', selectedUser.user);
      await deactivateUser(selectedUser.user, token);
      showToast('User deactivated successfully', 'success');
      fetchActivities(currentPage);
    } catch (error) {
      console.error('Error deactivating user:', error);
      showToast('Failed to deactivate user', 'error');
    } finally {
      setShowConfirm(false);
      setSelectedUser(null);
    }
  };

  const fetchDeactivatedUsersList = async () => {
    try {
      setLoadingDeactivated(true);
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      const data = await fetchDeactivatedUsers(token);
      setDeactivatedUsers(data);
    } catch (error) {
      console.error('Error fetching deactivated users:', error);
      showToast('Failed to load deactivated users', 'error');
    } finally {
      setLoadingDeactivated(false);
    }
  };

  const handleShowDeactivatedUsers = () => {
    setShowDeactivatedModal(true);
    fetchDeactivatedUsersList();
  };

  const handleReactivate = (user) => {
    console.log('handleReactivate called with user:', user);
    setSelectedUserToReactivate(user);
    setShowReactivateConfirm(true);
  };

  const confirmReactivate = async () => {
    try {
      console.log('confirmReactivate called');
      console.log('Reactivating user:', selectedUserToReactivate);
      const token = localStorage.getItem('access') || sessionStorage.getItem('access');
      await reactivateUser(selectedUserToReactivate.id, token);
      showToast('User reactivated successfully', 'success');
      fetchDeactivatedUsersList(); // Refresh the deactivated users list
    } catch (error) {
      console.error('Error reactivating user:', error);
      showToast('Failed to reactivate user', 'error');
    } finally {
      setShowReactivateConfirm(false);
      setSelectedUserToReactivate(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-primary-darker">
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-main text-accent-cream">Activity Log</h1>
        <button
          onClick={handleShowDeactivatedUsers}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaUserCheck /> Deactivated Accounts
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(activity.login_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        activity.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        activity.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {activity.is_active && (
                        <button
                          onClick={() => handleDeactivate(activity)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-2"
                          title="Deactivate Account"
                        >
                          <FaBan /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No activity records found
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Previous
              </button>
              
              {renderPagination()}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}

          <div className="text-center mt-4 text-sm text-accent-cream">
            Showing page {currentPage} of {totalPages} (Total: {Math.min(totalCount, 150)} records)
          </div>
        </>
      )}

      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          title="Deactivate User Account"
          message={`Are you sure you want to deactivate ${selectedUser?.username}'s account? This will prevent them from logging in.`}
          onConfirm={confirmDeactivate}
          onCancel={() => {
            setShowConfirm(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showReactivateConfirm && (
        <ConfirmDialog
          isOpen={showReactivateConfirm}
          title="Reactivate User Account"
          message={`Are you sure you want to reactivate ${selectedUserToReactivate?.username}'s account? This will allow them to log in again.`}
          onConfirm={confirmReactivate}
          onCancel={() => {
            setShowReactivateConfirm(false);
            setSelectedUserToReactivate(null);
          }}
        />
      )}

      {showDeactivatedModal && (
        <Modal
          isOpen={showDeactivatedModal}
          title="Deactivated Accounts"
          onClose={() => setShowDeactivatedModal(false)}
          maxWidth="4xl"
        >
          <div className="p-4">
            {loadingDeactivated ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {deactivatedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No deactivated users found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deactivatedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(user.date_joined)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(user.last_login)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleReactivate(user)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-2"
                                title="Reactivate Account"
                              >
                                <FaUserCheck /> Reactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default ActivityLog;
