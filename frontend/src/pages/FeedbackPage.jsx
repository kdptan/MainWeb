import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import { formatOrderId } from '../utils/formatters';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRating, setOrderRating] = useState(0);
  const [orderComment, setOrderComment] = useState('');
  const [productRatings, setProductRatings] = useState({});
  const [productComments, setProductComments] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to settle
    const hasToken = localStorage.getItem('access');
    if (!user && hasToken) {
      return;
    }

    if (!user) {
      toast.showToast('Please login to leave feedback', 'error');
      navigate('/signin');
      return;
    }

    fetchCompletedOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCompletedOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({ status: 'completed' });
      // Filter out orders that already have feedback
      const ordersWithoutFeedback = data.filter(order => !order.has_feedback);
      setCompletedOrders(ordersWithoutFeedback);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderId = (order) => {
    return formatOrderId(order.order_id || order.id);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setOrderRating(0);
    setOrderComment('');
    
    // Initialize product ratings
    const ratings = {};
    const comments = {};
    order.items.forEach(item => {
      if (item.item_type === 'product') {
        ratings[item.id] = 0;
        comments[item.id] = '';
      }
    });
    setProductRatings(ratings);
    setProductComments(comments);
  };

  const handleSubmitFeedback = async () => {
    if (orderRating === 0) {
      toast.showToast('Please rate your overall experience', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Submit PURCHASE FEEDBACK (Overall order review - Admin access only)
      // This is the overall purchase experience rating
      await orderService.createFeedback({
        order: selectedOrder.id,
        rating: orderRating,
        comment: orderComment || '',
      });

      // 2. Submit PRODUCT FEEDBACK (Individual product reviews - Public display)
      // These ratings will be displayed on the products page for all customers
      const productFeedbackPromises = selectedOrder.items
        .filter(item => item.item_type === 'product' && productRatings[item.id] > 0)
        .map(item => 
          orderService.createProductFeedback({
            order: selectedOrder.id,
            product: item.product,
            rating: productRatings[item.id],
            comment: productComments[item.id] || '',
          })
        );

      await Promise.all(productFeedbackPromises);

      toast.showToast('Thank you for your feedback!', 'success');
      setSelectedOrder(null);
      fetchCompletedOrders(); // Refresh list
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.showToast(error.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, setRating, size = 'text-2xl') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`${size} transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toast {...toast} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toast {...toast} />
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light transition-colors font-semibold"
          >
            <FaArrowLeft /> Back to Orders
          </button>
          <h1 className="display-md text-white mb-2">Leave Feedback</h1>
          <p className="text-white">Order ID: {generateOrderId(selectedOrder)}</p>
        </div>

        {/* Purchase Feedback - Admin Only */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-card text-gray-900">Purchase Feedback</h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin Only</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Your overall purchase experience feedback</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was your overall experience?
            </label>
            {renderStars(orderRating, setOrderRating)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about your experience..."
            />
          </div>
        </div>

        {/* Product Feedback - Public Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-card text-gray-900">Product Feedback</h2>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public Display</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Help other customers by rating individual products. These reviews will be displayed on the products page.</p>
          
          <div className="space-y-4">
            {selectedOrder.items
              .filter(item => item.item_type === 'product')
              .map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.product_details?.name || item.item_name}
                  </h3>
                  <div className="mb-3">
                    {renderStars(
                      productRatings[item.id] || 0,
                      (rating) => setProductRatings({ ...productRatings, [item.id]: rating }),
                      'text-xl'
                    )}
                  </div>
                  <textarea
                    value={productComments[item.id] || ''}
                    onChange={(e) => setProductComments({ ...productComments, [item.id]: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Share your thoughts on this product..."
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitFeedback}
            disabled={submitting || orderRating === 0}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              submitting || orderRating === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast {...toast} />

      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 bg-primary-dark text-white px-4 py-2 rounded-lg hover:bg-primary-darker transition-colors font-semibold mb-6"
      >
        <FaArrowLeft /> Back to Products
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="display-md text-accent-cream mb-2">Give Feedback</h1>
        <p className="text-accent-cream">Rate your completed orders and help us improve</p>
      </div>

      {/* Completed Orders List */}
      {completedOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaCheckCircle className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="heading-card text-gray-600 mb-2">No Orders to Review</h3>
          <p className="text-gray-500 mb-4">
            You don't have any completed orders that need feedback
          </p>
          <button
            onClick={() => navigate('/my-orders')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Orders
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {completedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {generateOrderId(order)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.completed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="price price-large text-gray-900">
                    ₱{parseFloat(order.total_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{order.items.length} items</p>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <span key={index} className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                      {item.product_details?.name || item.service_details?.service_name || item.item_name}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleSelectOrder(order)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FaStar /> Leave Feedback
              </button>
            </div>
          ))}
        </div>
      )}

      <Toast />
    </div>
  );
}
