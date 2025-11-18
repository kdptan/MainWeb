import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import { appointmentService } from '../services/appointmentService';
import Toast from '../components/Toast';
import { formatOrderId } from '../utils/formatters';
import { formatCurrency } from '../utils/formatters';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [completedOrders, setCompletedOrders] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [orderRating, setOrderRating] = useState(0);
  const [orderComment, setOrderComment] = useState('');
  const [productRatings, setProductRatings] = useState({});
  const [productComments, setProductComments] = useState({});
  const [appointmentRating, setAppointmentRating] = useState(0);
  const [appointmentComment, setAppointmentComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('products'); // 'products' or 'appointments'
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6; // 3 per column x 2 columns

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
    fetchCompletedAppointments();
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

  const fetchCompletedAppointments = async () => {
    try {
      const data = await appointmentService.getAppointments({ status: 'completed' });
      // Filter out appointments that already have feedback
      const appointmentsWithoutFeedback = (data || []).filter(apt => !apt.has_feedback);
      setCompletedAppointments(appointmentsWithoutFeedback);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const generateOrderId = (order) => {
    return formatOrderId(order.order_id || order.id);
  };

  // Filter orders by date
  const getFilteredOrders = () => {
    const dataToFilter = typeFilter === 'products' ? completedOrders : completedAppointments;
    
    // Ensure we always return an array
    if (!dataToFilter || !Array.isArray(dataToFilter)) return [];
    
    if (dateFilter === 'all') return dataToFilter;

    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '3months':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return dataToFilter;
    }

    return dataToFilter.filter(item => {
      const itemDate = typeFilter === 'products' 
        ? new Date(item.completed_at || item.created_at)
        : new Date(item.appointment_date);
      return itemDate >= filterDate;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, typeFilter]);

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

  const handleSubmitAppointmentFeedback = async () => {
    if (appointmentRating === 0) {
      toast.showToast('Please rate your appointment experience', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.createFeedback({
        appointment: selectedAppointment.id,
        rating: appointmentRating,
        comment: appointmentComment || '',
      });

      toast.showToast('Thank you for your feedback!', 'success');
      setSelectedAppointment(null);
      fetchCompletedAppointments(); // Refresh list
    } catch (error) {
      console.error('Error submitting appointment feedback:', error);
      toast.showToast(error.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentRating(0);
    setAppointmentComment('');
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

  if (selectedAppointment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toast {...toast} />
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedAppointment(null)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-chonky-white rounded-3xl hover:bg-secondary-light transition-colors font-semibold"
          >
            <FaArrowLeft /> Back to Appointments
          </button>
          <h1 className="display-md text-white mb-2">Leave Feedback</h1>
          <p className="text-white">Appointment with {selectedAppointment.pet_name}</p>
        </div>

        {/* Appointment Feedback Form */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-card text-chonky-brown">Appointment Feedback</h2>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public Display</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">Help other pet owners by sharing your experience. Your feedback will be displayed publicly.</p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was your appointment experience?
            </label>
            {renderStars(appointmentRating, setAppointmentRating, 'text-3xl')}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Your Experience
            </label>
            <textarea
              value={appointmentComment}
              onChange={(e) => setAppointmentComment(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about your appointment experience..."
            />
          </div>

          <div className="bg-gray-50 rounded-3xl p-4">
            <h3 className="font-semibold text-chonky-brown mb-2">Appointment Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Pet:</span> {selectedAppointment.pet_name}</p>
              <p><span className="font-medium">Breed:</span> {selectedAppointment.breed}</p>
              <p><span className="font-medium">Service:</span> {selectedAppointment.service_name}</p>
              <p><span className="font-medium">Date:</span> {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
              <p><span className="font-medium">Time:</span> {selectedAppointment.time_slot}</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedAppointment(null)}
            className="px-6 py-3 bg-red-500 text-white rounded-3xl hover:bg-red-700 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitAppointmentFeedback}
            disabled={submitting || appointmentRating === 0}
            className={`flex-1 px-6 py-3 rounded-3xl font-semibold transition-colors ${
              submitting || appointmentRating === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-btn-yellow text-chonky-brown hover:bg-secondary hover:text-chonky-white'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toast {...toast} />
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-chonky-white rounded-3xl hover:bg-secondary-light transition-colors font-semibold"
          >
            <FaArrowLeft /> Back to Orders
          </button>
          <h1 className="display-md text-white mb-2">Leave Feedback</h1>
          <p className="text-white">Order ID: {generateOrderId(selectedOrder)}</p>
        </div>

        {/* Feedback Sections Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Purchase Feedback - Admin Only */}
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-card text-chonky-brown">Purchase Feedback</h2>
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
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your experience..."
              />
            </div>
          </div>

          {/* Product Feedback - Public Display */}
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-card text-chonky-brown">Product Feedback</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public Display</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Help other customers by rating individual products. These reviews will be displayed on the products page.</p>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedOrder.items
                .filter(item => item.item_type === 'product')
                .map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-3xl p-4">
                    <h3 className="font-semibold text-chonky-brown mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Share your thoughts on this product..."
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-6 py-3 bg-red-500 text-white rounded-3xl hover:bg-red-700 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitFeedback}
            disabled={submitting || orderRating === 0}
            className={`flex-1 px-6 py-3 rounded-3xl font-semibold transition-colors ${
              submitting || orderRating === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-btn-yellow text-chonky-brown hover:bg-secondary hover:text-chonky-white'
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

      {/* Header */}
      <div className="mb-8 relative text-center">
        <button
          onClick={() => navigate('/products')}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown transition-colors font-semibold"
        >
          <FaArrowLeft /> Back to Products
        </button>
        
        <div>
          <h1 className="display-md text-chonky-white mb-2">Give Feedback</h1>
          <p className="text-chonky-white">Rate your completed orders and help us improve</p>
        </div>
      </div>

      {/* Type Filter */}
      <div className="bg-white rounded-3xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('products')}
            className={`px-6 py-2 rounded-3xl font-medium transition-colors ${
              typeFilter === 'products'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setTypeFilter('appointments')}
            className={`px-6 py-2 rounded-3xl font-medium transition-colors ${
              typeFilter === 'appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Appointments
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-3xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
              dateFilter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
              dateFilter === 'week'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
              dateFilter === 'month'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateFilter('3months')}
            className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
              dateFilter === '3months'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* Completed Orders/Appointments List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl shadow-md">
          <FaCheckCircle className="mx-auto text-6xl text-chonky-poop mb-4" />
          <h3 className="heading-card text-chonky-brown mb-2">
            {typeFilter === 'products' ? 'No Orders to Review' : 'No Appointments to Review'}
          </h3>
          <p className="text-chonky-brown mb-4">
            {dateFilter === 'all' 
              ? `You don't have any completed ${typeFilter === 'products' ? 'orders' : 'appointments'} that need feedback.`
              : `No completed ${typeFilter === 'products' ? 'orders' : 'appointments'} found in the selected time period.`}
          </p>
          <button
            onClick={() => navigate(typeFilter === 'products' ? '/my-orders' : '/appointments')}
            className="bg-secondary text-chonky-white px-6 py-3 rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown transition-colors"
          >
            {typeFilter === 'products' ? 'View My Orders' : 'View My Appointments'}
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {typeFilter === 'products' ? (
            // Product Orders
            filteredOrders
              .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
              .map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-chonky-brown mb-1">
                      {generateOrderId(order)}
                    </h3>
                    <p className="text-sm text-chonky-poop">
                      {new Date(order.completed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="price price-large text-chonky-brown">
                      {formatCurrency(order.total_price)}
                    </p>
                    <p className="text-sm text-chonky-poop">{order.items.length} items</p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <span key={index} className="text-sm bg-accent-tan px-3 py-1 rounded-full text-chonky-white">
                        {item.product_details?.name || item.service_details?.service_name || item.item_name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-sm bg-accent-tan px-3 py-1 rounded-full text-chonky-white">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectOrder(order)}
                  className="w-full py-2 px-4 bg-secondary text-chonky-white rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FaStar /> Leave Feedback
                </button>
              </div>
            ))
          ) : (
            // Appointments
            filteredOrders
              .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
              .map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-chonky-brown mb-1">
                      {appointment.pet_name}
                    </h3>
                    <p className="text-sm text-chonky-poop">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-chonky-brown">
                      {appointment.time_slot}
                    </p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                      {appointment.service_name}
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {appointment.breed}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectAppointment(appointment)}
                  className="w-full py-2 px-4 bg-secondary text-chonky-white rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FaStar /> Leave Feedback
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {filteredOrders.length > ordersPerPage && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-secondary text-chonky-white rounded-3xl hover:bg-chonky-poop disabled:bg-chonky-khaki disabled:cursor-not-allowed font-medium transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(filteredOrders.length / ordersPerPage) }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-3xl font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-secondary text-chonky-white'
                        : 'bg-chonky-white text-chonky-brown hover:bg-chonky-poop hover:text-chonky-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            
            <button
              onClick={() =>
                setCurrentPage(prev =>
                  Math.min(prev + 1, Math.ceil(filteredOrders.length / ordersPerPage))
                )
              }
              disabled={currentPage === Math.ceil(filteredOrders.length / ordersPerPage)}
              className="px-4 py-2 bg-secondary text-chonky-white rounded-3xl hover:bg-chonky-poop disabled:bg-chonky-khaki disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
            </button>
          </div>
        )}

        <p className="text-center mt-4 text-chonky-white">
          Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)} (Showing {Math.min(ordersPerPage, filteredOrders.length - (currentPage - 1) * ordersPerPage)} of {filteredOrders.length} orders)
        </p>
        </>
      )}

      <Toast />
    </div>
  );
}
