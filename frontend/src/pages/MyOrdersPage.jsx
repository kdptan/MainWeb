import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaBox, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import { formatOrderId } from '../utils/formatters';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Wait for auth to settle before checking
    const hasToken = localStorage.getItem('access');
    if (!user && hasToken) {
      // User is still loading
      return;
    }

    if (!user) {
      toast.showToast('Please login to view your orders', 'error');
      navigate('/signin');
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrders();
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
  }, [user]); // Only run when user changes

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
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
    // Use the professional serial number format
    return formatOrderId(order.order_id || order.id);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filterStatus);

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
        <h1 className="display-md text-accent-cream mb-2">My Orders</h1>
        <p className="text-accent-cream">Track and manage your purchase history</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({orders.filter(o => o.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'cancelled'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({orders.filter(o => o.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
          <h2 className="heading-card text-gray-700 mb-2">
            {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
          </h2>
          <p className="text-gray-500 mb-6">
            {filterStatus === 'all' 
              ? 'Start shopping to create your first order!' 
              : `You don't have any ${filterStatus} orders.`}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Order ID: {generateOrderId(order)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="price price-large text-gray-900">
                        ₱{Number(order.total_price).toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Branch</p>
                    <p className="text-sm font-semibold text-gray-900">{order.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Items</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Order Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Toggle Details Button */}
                <button
                  onClick={() => toggleOrderDetails(order.id)}
                  className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-2 text-gray-700 font-semibold transition-colors"
                >
                  {expandedOrder === order.id ? (
                    <>
                      Hide Details <FaChevronUp />
                    </>
                  ) : (
                    <>
                      View Details <FaChevronDown />
                    </>
                  )}
                </button>
              </div>

              {/* Order Details (Expandable) */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-4 flex items-start gap-4 border border-gray-200"
                      >
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">
                            {item.item_type === 'product' ? '🐾' : '✨'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {item.product_details?.name || 
                             item.service_details?.service_name || 
                             item.item_name || 
                             'Unknown Item'}
                          </h5>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.item_type === 'product' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.item_type === 'product' ? 'Product' : 'Service'}
                            </span>
                            
                            {/* Show product details */}
                            {item.item_type === 'product' && item.product_details && (
                              <>
                                {item.product_details.category && (
                                  <span className="text-gray-500">
                                    {item.product_details.category}
                                  </span>
                                )}
                                {item.product_details.supplier && (
                                  <span className="text-gray-500">
                                    Supplier: {item.product_details.supplier}
                                  </span>
                                )}
                              </>
                            )}
                            
                            {/* Show service description */}
                            {item.item_type === 'service' && item.service_details?.description && (
                              <span className="text-gray-500 block mt-1">
                                {item.service_details.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="font-bold text-gray-900">
                            ₱{Number(item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-4">
                      <h4 className="font-bold text-gray-900 mb-2">Order Notes</h4>
                      <p className="text-sm text-gray-600 bg-white rounded-lg p-4">
                        {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Completed Date */}
                  {order.completed_at && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Completed on: {formatDate(order.completed_at)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Toast />
    </div>
  );
}
