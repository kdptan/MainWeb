import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaUser, FaShoppingBag, FaCalendar, FaComment, FaPaw } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import { formatOrderId } from '../utils/formatters';

export default function AdminFeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [purchaseFeedbacks, setPurchaseFeedbacks] = useState([]);
  const [appointmentFeedbacks, setAppointmentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [typeFilter, setTypeFilter] = useState('purchases'); // 'purchases' or 'appointments'
  const [currentPage, setCurrentPage] = useState(1);
  const feedbacksPerPage = 10; // 5 per column x 2 columns

  useEffect(() => {
    // Wait for auth to settle before checking
    const hasToken = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (!user && hasToken) {
      // User is still loading
      return;
    }

    // Redirect non-admin users
    if (!user || !user.is_staff) {
      toast.showToast('Admin access required', 'error');
      navigate('/products');
      return;
    }

    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const [purchaseData, appointmentData] = await Promise.all([
        orderService.getAllFeedback(),
        appointmentService.getAllFeedback()
      ]);
      setPurchaseFeedbacks(purchaseData);
      setAppointmentFeedbacks(appointmentData || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.showToast('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderId = (feedback) => {
    return formatOrderId(feedback.order_id || feedback.order);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
            size={20}
          />
        ))}
      </div>
    );
  };

  const feedbacks = typeFilter === 'purchases' ? purchaseFeedbacks : appointmentFeedbacks;
  
  const filteredFeedbacks = filterRating === 'all'
    ? feedbacks
    : feedbacks.filter(fb => fb.rating === parseInt(filterRating));

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRating, typeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * feedbacksPerPage,
    currentPage * feedbacksPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-primary-darker">
      <Toast />

      {/* Header */}
      <div className="mb-8">
        <h1 className="display-md text-accent-cream mb-2">Customer Feedback</h1>
        <p className="text-accent-cream">
          {typeFilter === 'purchases' 
            ? 'Overall order experience feedback from customers'
            : 'Appointment experience feedback from customers'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
              <p className="text-3xl font-bold text-gray-900">{feedbacks.length}</p>
            </div>
            <FaComment className="text-blue-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
            </div>
            <FaStar className="text-yellow-400" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rating Breakdown</p>
              <div className="flex gap-2 mt-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = feedbacks.filter(fb => fb.rating === rating).length;
                  return (
                    <div key={rating} className="text-center">
                      <div className="text-xs text-gray-600">{rating}⭐</div>
                      <div className="text-sm font-semibold">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-md p-4 mb-6">
        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
          <button
            onClick={() => setTypeFilter('purchases')}
            className={`px-6 py-2 rounded-3xl font-medium transition-colors flex items-center gap-2 ${
              typeFilter === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaShoppingBag /> Purchases
          </button>
          <button
            onClick={() => setTypeFilter('appointments')}
            className={`px-6 py-2 rounded-3xl font-medium transition-colors flex items-center gap-2 ${
              typeFilter === 'appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaPaw /> Appointments
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by Rating:</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          
          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredFeedbacks.length} of {feedbacks.length} feedback(s)
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-md p-12 text-center">
          <FaComment className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Yet</h3>
          <p className="text-gray-500">
            {filterRating === 'all'
              ? `No ${typeFilter === 'purchases' ? 'purchase' : 'appointment'} feedback has been submitted yet.`
              : `No feedback with ${filterRating} star(s) found.`}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedFeedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {feedback.username ? feedback.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" size={12} />
                      <p className="font-semibold text-gray-900">{feedback.username}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {typeFilter === 'purchases' ? (
                        <>
                          <FaShoppingBag size={12} />
                          <span>{generateOrderId(feedback)}</span>
                        </>
                      ) : (
                        <>
                          <FaPaw size={12} />
                          <span>{feedback.service_name}</span>
                          {feedback.appointment_date && (
                            <span className="ml-2">
                              • {new Date(feedback.appointment_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {renderStars(feedback.rating)}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <FaCalendar size={10} />
                    <span>{formatDate(feedback.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              {feedback.comment && (
                <div className="bg-gray-50 rounded-3xl p-4 border-l-4 border-blue-500">
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.comment}</p>
                </div>
              )}

              {/* No Comment */}
              {!feedback.comment && (
                <div className="bg-gray-50 rounded-3xl p-4 border-l-4 border-gray-300">
                  <p className="text-gray-400 italic">No written feedback provided</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-3xl font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-secondary text-white'
                      : 'bg-white text-chonky-brown hover:bg-gray-100 border border-secondary'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
            </button>
          </div>
        )}
        
        <p className="text-center mt-4 text-white">
          Page {currentPage} of {totalPages} (Showing {Math.min(feedbacksPerPage, filteredFeedbacks.length - (currentPage - 1) * feedbacksPerPage)} of {filteredFeedbacks.length} feedback(s))
        </p>
        </>
      )}
    </div>
  );
}
