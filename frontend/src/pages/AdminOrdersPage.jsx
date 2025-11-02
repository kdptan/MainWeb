import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaBox, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp, FaUser } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
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

  const handleMarkAsCompleted = async (orderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark Order as Completed',
      message: 'Mark this order as completed? The customer will be able to leave feedback.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        
        try {
          await orderService.adminUpdateOrderStatus(orderId, 'completed');
          toast.showToast('Order marked as completed', 'success');
          
          // Refresh orders list
          const filters = {};
          if (filterStatus !== 'all') filters.status = filterStatus;
          if (filterBranch !== 'all') filters.branch = filterBranch;
          const data = await orderService.getAllOrdersAdmin(filters);
          setOrders(data);
        } catch (error) {
          console.error('Error updating order status:', error);
          toast.showToast('Failed to update order status', 'error');
        }
      }
    });
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

  const generateOrderId = (order) => {
    // Generate unique order ID: ORD-YYYYMMDD-000X
    const date = new Date(order.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const orderId = String(order.id).padStart(4, '0');
    return `ORD-${year}${month}${day}-${orderId}`;
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-red-600 mb-2 flex items-center gap-3">
              <FaShoppingBag /> Admin: All Orders
            </h1>
            <p className="text-gray-600">View and manage orders from all users</p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            <option value="Matina">Matina</option>
            <option value="Toril">Toril</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
          <p className="text-gray-500">No orders match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order ID: {generateOrderId(order)}
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
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <FaUser className="text-gray-400" />
                      <span className="font-medium">
                        {order.user.first_name} {order.user.last_name}
                      </span>
                      <span className="text-gray-400">({order.user.email})</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{order.items.length} items</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => toggleOrderDetails(order.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
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
                  
                  {/* Mark as Completed Button - Only for pending orders */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsCompleted(order.id)}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                    >
                      <FaCheckCircle /> Mark as Completed
                    </button>
                  )}
                  
                  {/* Cancel Order Button - Only for pending orders */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm transition-colors"
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
                    <h4 className="font-semibold text-gray-900 mb-3">Order Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-1">
                              {item.product_details?.name || 
                               item.service_details?.service_name || 
                               item.item_name || 
                               'Unknown Item'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
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
                                    <span className="text-gray-500">
                                      Category: {item.product_details.category}
                                    </span>
                                  )}
                                  {item.product_details.branch && (
                                    <span className="text-gray-500">
                                      Branch: {item.product_details.branch}
                                    </span>
                                  )}
                                </>
                              )}
                              
                              {/* Show service details */}
                              {item.item_type === 'service' && item.service_details && (
                                <>
                                  {item.service_details.description && (
                                    <span className="text-gray-500 block mt-1">
                                      {item.service_details.description}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            <p className="font-semibold text-gray-900 text-lg">
                              ₱{parseFloat(item.price).toFixed(2)}
                            </p>
                            {item.item_type === 'product' && item.product_details?.unit_cost && (
                              <p className="text-xs text-gray-500">
                                ₱{parseFloat(item.product_details.unit_cost).toFixed(2)} each
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
                      <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                    </div>
                  )}

                  {/* Completion Date */}
                  {order.completed_at && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Completed At:</h4>
                      <p className="text-gray-700">{formatDate(order.completed_at)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
