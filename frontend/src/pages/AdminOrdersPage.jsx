import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaBox, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp, FaUser, FaReceipt, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import { formatOrderId } from '../utils/formatters';
import { formatCurrency } from '../utils/formatters';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    // Wait for auth to settle before checking
    const hasToken = localStorage.getItem('access');
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

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (filterStatus !== 'all') filters.status = filterStatus;
        if (filterBranch !== 'all') filters.branch = filterBranch;
        
        const data = await orderService.getAllOrdersAdmin(filters);
        setOrders(data);
        setCurrentPage(1); // Reset to first page when filters change
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.showToast('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatus, filterBranch]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleMarkAsCompleted = (orderId) => {
    // Find the order and open payment modal
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrderForPayment(order);
      setPaymentModalOpen(true);
    }
  };

  const handleViewReceipt = (orderId) => {
    // Find the order from the orders list
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      // Format order data as a transaction object for ReceiptModal
      const transaction = {
        referenceNumber: formatOrderId(order.order_id || order.id),
        orderId: order.id,
        customerName: `${order.user.first_name} ${order.user.last_name}`,
        paymentDate: order.completed_at || order.created_at,
        paymentTime: new Date(order.completed_at || order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        branch: order.branch,
        paymentMethod: 'Online Order',
        items: order.items || [],
        subtotal: parseFloat(order.total_price) || 0,
        tax: 0,
        total: parseFloat(order.total_price) || 0,
        amountPaid: parseFloat(order.amount_paid) || parseFloat(order.total_price) || 0,
        change: parseFloat(order.change) || 0,
        status: order.status,
      };
      
      setSelectedReceipt(transaction);
      setReceiptModalOpen(true);
    } else {
      toast.showToast('Order not found', 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Cancel this order? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        try {
          await orderService.adminUpdateOrderStatus(orderId, 'cancelled');
          toast.showToast('Order cancelled', 'success');
          
          // Refresh orders list
          const filters = {};
          if (filterStatus !== 'all') filters.status = filterStatus;
          if (filterBranch !== 'all') filters.branch = filterBranch;
          const data = await orderService.getAllOrdersAdmin(filters);
          setOrders(data);
        } catch (error) {
          console.error('Error cancelling order:', error);
          toast.showToast('Failed to cancel order', 'error');
        }
      }
    });
  };

  const handleMarkAsAvailableForPickup = async (orderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark as Available for Pickup',
      message: 'Mark this order as available for pickup? The customer will be notified.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        try {
          await orderService.adminUpdateOrderStatus(orderId, 'available_for_pickup');
          toast.showToast('Order marked as available for pickup', 'success');
          
          // Refresh orders list
          const filters = {};
          if (filterStatus !== 'all') filters.status = filterStatus;
          if (filterBranch !== 'all') filters.branch = filterBranch;
          const data = await orderService.getAllOrdersAdmin(filters);
          setOrders(data);
        } catch (error) {
          console.error('Error marking order as available:', error);
          toast.showToast('Failed to mark order as available', 'error');
        }
      }
    });
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      if (selectedOrderForPayment) {
        // Pass payment data to the backend
        const data = {
          amount_paid: paymentData?.amountPaid || selectedOrderForPayment.total_price,
          change: paymentData?.change || 0,
        };
        
        await orderService.adminUpdateOrderStatus(selectedOrderForPayment.id, 'completed', data);
        
        // Store payment data in sessionStorage for immediate receipt display
        sessionStorage.setItem(
          `orderPayment_${selectedOrderForPayment.id}`,
          JSON.stringify(data)
        );
        
        toast.showToast('Order marked as completed and payment recorded', 'success');
        
        // Refresh orders list
        const filters = {};
        if (filterStatus !== 'all') filters.status = filterStatus;
        if (filterBranch !== 'all') filters.branch = filterBranch;
        const updatedOrders = await orderService.getAllOrdersAdmin(filters);
        setOrders(updatedOrders);
        
        // Close payment modal
        setPaymentModalOpen(false);
        setSelectedOrderForPayment(null);
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.showToast('Failed to complete payment', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <FaClock className="inline mr-1" />;
      case 'completed':
        return <FaCheckCircle className="inline mr-1" />;
      case 'cancelled':
        return <FaTimesCircle className="inline mr-1" />;
      default:
        return <FaBox className="inline mr-1" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toast {...toast} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast {...toast} />
      <PaymentModal 
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedOrderForPayment(null);
        }}
        order={selectedOrderForPayment}
        onPaymentComplete={handlePaymentComplete}
      />

      <ReceiptModal 
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
        transaction={selectedReceipt}
      />

      {/* Header */}
      <div className="mb-8 relative text-center">
        <button
          onClick={() => navigate('/products')}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown transition-colors font-semibold"
        >
          <FaArrowLeft /> Back to Products
        </button>
        
        <div>
          <h1 className="display-md text-accent-cream mb-2 flex items-center justify-center gap-3">
            <FaShoppingBag /> Admin: All Orders
          </h1>
          <p className="text-accent-cream">View and manage orders from all users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-4 py-2 rounded-3xl font-medium transition-colors ${
                filterStatus === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              <option value="Matina">Matina</option>
              <option value="Toril">Toril</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
          <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-chonky-poop mb-2">No orders found</h3>
          <p className="text-chonky-khaki">No orders match your current filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders
              .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
              .map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-chonky-brown">
                        Order ID: {formatOrderId(order.order_id || order.id)}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* User Information */}
                    <div className="flex items-center gap-2 text-sm text-chonky-poop mb-1">
                      <FaUser className="text-chonky-khaki" />
                      <span className="font-medium">
                        {order.user.first_name} {order.user.last_name}
                      </span>
                      <span className="text-chonky-khaki">({order.user.email})</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-chonky-poop">
                      <span>
                        <FaClock className="inline mr-1" />
                        {formatDate(order.created_at)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {order.branch}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-chonky-brown">
                      {formatCurrency(order.total_price)}
                    </p>
                    <p className="text-sm text-chonky-khaki">{order.items.length} items</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => toggleOrderDetails(order.id)}
                    className="flex items-center gap-2 text-accent-peach hover:text-chonky-brown font-medium text-sm transition-colors"
                  >
                    {expandedOrder === order.id ? (
                      <>
                        <FaChevronUp /> Hide Details
                      </>
                    ) : (
                      <>
                        <FaChevronDown /> Show Details
                      </>
                    )}
                  </button>
                  
                  {/* Mark as Available for Pickup Button - Only for pending orders */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsAvailableForPickup(order.id)}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 font-medium text-sm transition-colors"
                    >
                      🔔 Mark as Available for Pickup
                    </button>
                  )}

                  {/* Mark as Completed Button - Only for orders available for pickup */}
                  {order.status === 'available_for_pickup' && (
                    <button
                      onClick={() => handleMarkAsCompleted(order.id)}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-3xl hover:bg-green-700 font-medium text-sm transition-colors"
                    >
                      <FaCheckCircle /> Mark as Completed
                    </button>
                  )}

                  {/* View Receipt Button - Only for completed orders */}
                  {order.status === 'completed' && (
                    <button
                      onClick={() => handleViewReceipt(order.id)}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-btn-yellow text-chonky-brown rounded-3xl hover:bg-secondary hover:text-chonky-white font-medium text-sm transition-colors"
                    >
                      <FaReceipt /> View Receipt
                    </button>
                  )}
                  
                  {/* Cancel Order Button - For pending or available for pickup orders */}
                  {(order.status === 'pending' || order.status === 'available_for_pickup') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-3xl hover:bg-red-600 font-medium text-sm transition-colors"
                    >
                      <FaTimesCircle /> Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Order Details (Expandable) */}
              {expandedOrder === order.id && (
                <div className="p-6">
                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-chonky-brown mb-3">Order Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-4 bg-gray-50 rounded-3xl border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-chonky-brown mb-1">
                              {item.product_details?.name || 
                               item.service_details?.service_name || 
                               item.item_name || 
                               'Unknown Item'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm text-chonky-poop">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.item_type === 'product' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.item_type === 'product' ? 'Product' : 'Service'}
                              </span>
                              
                              {/* Show additional product details */}
                              {item.item_type === 'product' && item.product_details && (
                                <>
                                  {item.product_details.category && (
                                    <span className="text-chonky-khaki">
                                      Category: {item.product_details.category}
                                    </span>
                                  )}
                                  {item.product_details.branch && (
                                    <span className="text-chonky-khaki">
                                      Branch: {item.product_details.branch}
                                    </span>
                                  )}
                                </>
                              )}
                              
                              {/* Show service details */}
                              {item.item_type === 'service' && item.service_details && (
                                <>
                                  {item.service_details.description && (
                                    <span className="text-chonky-khaki block mt-1">
                                      {item.service_details.description}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-chonky-poop">Qty: {item.quantity}</p>
                            <p className="font-semibold text-chonky-brown text-lg">
                              {formatCurrency(item.price)}
                            </p>
                            {item.item_type === 'product' && item.product_details?.unit_cost && (
                              <p className="text-xs text-chonky-khaki">
                                {formatCurrency(item.product_details.unit_cost)} each
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-chonky-brown mb-2">Notes:</h4>
                      <p className="text-gray-700 bg-chonky-khaki p-3 rounded-3xl">{order.notes}</p>
                    </div>
                  )}

                  {/* Completion Date */}
                  {order.completed_at && (
                    <div>
                      <h4 className="font-semibold text-chonky-brown mb-2">Completed At:</h4>
                      <p className="text-chonky-poop">{formatDate(order.completed_at)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-secondary text-chonky-white rounded-3xl hover:bg-chonky-poop disabled:bg-chonky-khaki disabled:cursor-not-allowed font-medium transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(orders.length / ordersPerPage) }, (_, i) => i + 1).map(
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
                  Math.min(prev + 1, Math.ceil(orders.length / ordersPerPage))
                )
              }
              disabled={currentPage === Math.ceil(orders.length / ordersPerPage)}
              className="px-4 py-2 bg-secondary text-chonky-white rounded-3xl hover:bg-chonky-poop disabled:bg-chonky-khaki disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
            </button>
          </div>

          <p className="text-center mt-4 text-chonky-khaki">
            Page {currentPage} of {Math.ceil(orders.length / ordersPerPage)} (Showing {Math.min(ordersPerPage, orders.length - (currentPage - 1) * ordersPerPage)} of {orders.length} orders)
          </p>
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <Toast />
    </div>
  );
}
