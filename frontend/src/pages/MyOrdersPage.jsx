import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaBox, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import { formatOrderId } from '../utils/formatters';
import { formatCurrency } from '../utils/formatters';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const modalRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6; // 3 per column x 2 columns
  const [modalItemsPage, setModalItemsPage] = useState(1);
  const itemsPerModalPage = 3;

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
  }, [user]);

  // Scroll modal to center when it opens
  useEffect(() => {
    if (selectedOrderForModal && modalRef.current) {
      setTimeout(() => {
        modalRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [selectedOrderForModal]); // Only run when user changes

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterBranch]);

  const toggleOrderDetails = (order) => {
    setSelectedOrderForModal(order);
    setModalItemsPage(1); // Reset to first page when opening modal
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-brand-sand text-chonky-brown border-yellow-400';
      case 'completed':
        return 'bg-green-200 text-green-800 border-green-400';
      case 'cancelled':
        return 'bg-red-200 text-red-800 border-red-400';
      default:
        return 'bg-gray-200 text-gray-800 border-gray-400';
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

  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status.toLowerCase() === filterStatus;
    const branchMatch = filterBranch === 'all' || order.branch === filterBranch;
    return statusMatch && branchMatch;
  });

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
      {/* Header */}
      <div className="mb-8 relative text-center">
        <button
          onClick={() => navigate('/products')}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown transition-colors font-semibold"
        >
          <FaArrowLeft /> Back to Products
        </button>
        
        <div>
          <h1 className="display-md text-accent-cream mb-2">My Orders</h1>
          <p className="text-accent-cream">Track and manage your purchase history</p>
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
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-chonky-white rounded-3xl shadow-sm">
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
            className="bg-secondary text-chonky-white px-6 py-3 rounded-3xl hover:bg-btn-yellow hover:text-chonky-brown transition-colors"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders
              .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
              .map((order) => (
            <div
              key={order.id}
              className="bg-chonky-white rounded-3xl shadow-md overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <div>
                      <p className="text-xs text-chonky-brown opacity-60 mb-1">Order ID</p>
                      <h3 className="text-lg font-bold text-chonky-brown mb-1">
                        {generateOrderId(order)}
                      </h3>
                    </div>
                    <p className="text-sm text-chonky-poop">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-chonky-poop">Total Amount</p>
                      <p className="price price-large text-chonky-brown">
                        {formatCurrency(order.total_price)}
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
                    <p className="text-xs text-chonky-poop uppercase">Branch</p>
                    <p className="text-sm font-semibold text-chonky-brown">{order.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-chonky-poop uppercase">Items</p>
                    <p className="text-sm font-semibold text-chonky-brown">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-chonky-poop uppercase">Order Date</p>
                    <p className="text-sm font-semibold text-chonky-brown">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Toggle Details Button */}
                <button
                  onClick={() => toggleOrderDetails(order)}
                  className="w-full py-2 px-4 bg-chonky-khaki hover:bg-accent-tan rounded-3xl flex items-center justify-center gap-2 text-chonky-brown font-semibold transition-colors"
                >
                  View Details <FaChevronDown />
                </button>
              </div>
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

        <p className="text-center mt-4 text-chonky-khaki">
          Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)} (Showing {Math.min(ordersPerPage, filteredOrders.length - (currentPage - 1) * ordersPerPage)} of {filteredOrders.length} orders)
        </p>
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-3xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-chonky-brown">Order Details</h2>
                  <p className="text-sm text-chonky-poop mt-1">
                    Order ID: {generateOrderId(selectedOrderForModal)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForModal(null)}
                  className="text-gray-400 hover:text-chonky-brown transition-colors p-2"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-3xl">
                <div>
                  <p className="text-xs text-chonky-poop uppercase mb-1">Status</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(selectedOrderForModal.status)}`}>
                    {getStatusIcon(selectedOrderForModal.status)}
                    {selectedOrderForModal.status.charAt(0).toUpperCase() + selectedOrderForModal.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-chonky-poop uppercase mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-chonky-brown">
                    {formatCurrency(selectedOrderForModal.total_price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-chonky-poop uppercase mb-1">Branch</p>
                  <p className="text-sm font-semibold text-chonky-brown">{selectedOrderForModal.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-chonky-poop uppercase mb-1">Order Date</p>
                  <p className="text-sm font-semibold text-chonky-brown">
                    {formatDate(selectedOrderForModal.created_at)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-bold text-chonky-brown mb-4 text-lg">Order Items ({selectedOrderForModal.items?.length || 0})</h4>
                <div className="space-y-3">
                  {selectedOrderForModal.items
                    ?.slice((modalItemsPage - 1) * itemsPerModalPage, modalItemsPage * itemsPerModalPage)
                    .map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-3xl p-4 flex items-start gap-4"
                    >
                      <div className="bg-gradient-to-br from-accent-tan to-chonky-brown-light w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">
                          {item.item_type === 'product' ? '🐾' : '✨'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-chonky-brown mb-1">
                          {item.product_details?.name || 
                           item.service_details?.service_name || 
                           item.item_name || 
                           'Unknown Item'}
                        </h5>
                        <div className="flex flex-wrap gap-2 text-sm text-chonky-poop">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.item_type === 'product' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.item_type === 'product' ? 'Product' : 'Service'}
                          </span>
                          
                          {item.item_type === 'product' && item.product_details && (
                            <>
                              {item.product_details.category && (
                                <span className="text-chonky-poop">
                                  {item.product_details.category}
                                </span>
                              )}
                              {item.product_details.supplier && (
                                <span className="text-chonky-poop">
                                  Supplier: {item.product_details.supplier}
                                </span>
                              )}
                            </>
                          )}
                          
                          {item.item_type === 'service' && item.service_details?.description && (
                            <span className="text-chonky-poop block mt-1">
                              {item.service_details.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-chonky-poop">Qty: {item.quantity}</p>
                        <p className="font-bold text-chonky-brown">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal Items Pagination */}
                {selectedOrderForModal.items && selectedOrderForModal.items.length > itemsPerModalPage && (
                  <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setModalItemsPage(prev => Math.max(prev - 1, 1))}
                      disabled={modalItemsPage === 1}
                      className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-chonky-poop disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Previous
                    </button>
                    
                    <span className="text-chonky-brown font-semibold">
                      Page {modalItemsPage} of {Math.ceil(selectedOrderForModal.items.length / itemsPerModalPage)}
                    </span>
                    
                    <button
                      onClick={() => setModalItemsPage(prev => Math.min(prev + 1, Math.ceil(selectedOrderForModal.items.length / itemsPerModalPage)))}
                      disabled={modalItemsPage === Math.ceil(selectedOrderForModal.items.length / itemsPerModalPage)}
                      className="px-4 py-2 bg-secondary text-white rounded-3xl hover:bg-chonky-poop disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedOrderForModal.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-chonky-brown mb-2 text-lg">Order Notes</h4>
                  <p className="text-sm text-chonky-poop bg-gray-50 rounded-3xl p-4">
                    {selectedOrderForModal.notes}
                  </p>
                </div>
              )}

              {/* Completed Date */}
              {selectedOrderForModal.completed_at && (
                <div className="p-4 bg-green-50 rounded-3xl">
                  <p className="text-sm font-semibold text-green-800">
                    ✓ Completed on: {formatDate(selectedOrderForModal.completed_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
}
