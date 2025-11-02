import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaUser, FaShoppingBag, FaCalendar, FaComment } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import managementBg from '../assets/Management.png';

export default function AdminFeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');

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
      const data = await orderService.getAllFeedback();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.showToast('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderId = (feedback) => {
    if (!feedback.order_created_at) {
      return `Order #${feedback.order_id || feedback.order}`;
    }
    const date = new Date(feedback.order_created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const orderId = String(feedback.order_id || feedback.order).padStart(4, '0');
    return `ORD-${year}${month}${day}-${orderId}`;
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

  const filteredFeedbacks = filterRating === 'all'
    ? feedbacks
    : feedbacks.filter(fb => fb.rating === parseInt(filterRating));

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-accent-cream bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${managementBg})` }}>
      <Toast />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-accent-cream mb-2">Purchase Feedback</h1>
        <p className="text-accent-cream">Overall order experience feedback from customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
              <p className="text-3xl font-bold text-gray-900">{feedbacks.length}</p>
            </div>
            <FaComment className="text-blue-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
            </div>
            <FaStar className="text-yellow-400" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by Rating:</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaComment className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Yet</h3>
          <p className="text-gray-500">
            {filterRating === 'all'
              ? 'No purchase feedback has been submitted yet.'
              : `No feedback with ${filterRating} star(s) found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                      <FaShoppingBag size={12} />
                      <span>{generateOrderId(feedback)}</span>
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
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.comment}</p>
                </div>
              )}

              {/* No Comment */}
              {!feedback.comment && (
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                  <p className="text-gray-400 italic">No written feedback provided</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
