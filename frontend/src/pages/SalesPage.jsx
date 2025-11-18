import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaPlus, FaMinus, FaCheckCircle, FaBox, FaClock, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import SalesReceiptModal from '../components/SalesReceiptModal';
import { formatCurrency } from '../utils/formatters';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper function to get valid token
const getValidToken = async () => {
  let token = localStorage.getItem('access') || sessionStorage.getItem('access');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return token;
};

// Helper function to make API calls with token refresh
const fetchWithAuth = async (url, options = {}) => {
  let token = await getValidToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // If 401 Unauthorized, try to refresh token
  if (response.status === 401) {
    // Try to refresh the token
    const refreshToken = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('access', data.access);
          sessionStorage.setItem('access', data.access);
          
          // Retry the original request with new token
          token = data.access;
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
    
    // If refresh failed or no refresh token, redirect to login
    throw new Error('Session expired. Please log in again.');
  }
  
  return response;
};

export default function SalesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const serviceTypeModalRef = useRef(null);
  const checkoutModalRef = useRef(null);

  // Page states
  const [currentView, setCurrentView] = useState('pos'); // 'pos' or 'history'

  // POS States
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  // Removed searchQuery and setSearchQuery since search bar is gone
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Matina');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History states
  const [salesHistory, setSalesHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState(''); // blank means no filter
  const [historyBranch, setHistoryBranch] = useState('all'); // 'all' means no filter

  // Service Type Selection Modal
  const [serviceTypeModal, setServiceTypeModal] = useState({
    isOpen: false,
    service: null,
    serviceType: null // 'solo' or 'addon'
  });

  // Checkout Modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Scroll modals to center when they open
  useEffect(() => {
    if (serviceTypeModal.isOpen && serviceTypeModalRef.current) {
      setTimeout(() => {
        serviceTypeModalRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [serviceTypeModal.isOpen]);

  useEffect(() => {
    if (checkoutModalOpen && checkoutModalRef.current) {
      setTimeout(() => {
        checkoutModalRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [checkoutModalOpen]);

  // Track if data has been fetched to avoid refetch loop
  const [dataFetched, setDataFetched] = useState(false);


  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/products/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access') || sessionStorage.getItem('access')}`
        }
      });
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/`);
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, []);

  // Auth check - only fetch once when user is authenticated
  useEffect(() => {
    const hasToken = localStorage.getItem('access');
    if (!user && hasToken) return;

    if (!user || !user.is_staff) {
      if (user) {
        showToast('Admin access required', 'error');
        navigate('/products');
      }
      return;
    }

    // Only fetch if not already fetched
    if (!dataFetched) {
      fetchProducts();
      fetchServices();
      setDataFetched(true);
    }
  }, [user, dataFetched, fetchProducts, fetchServices, navigate, showToast]);

  const fetchSalesHistory = useCallback(async (filterDate = '', filterBranch = 'all') => {
    setHistoryLoading(true);
    try {
      let url = `${API_BASE_URL}/sales/`;
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterBranch !== 'all') params.append('branch', filterBranch);
      if (params.toString()) {
        url += `?${params}`;
      }
      
      console.log('Fetching sales history from:', url);
      console.log('Filter date:', filterDate, 'Filter branch:', filterBranch);
      
      const response = await fetchWithAuth(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Sales history fetched, total count:', Array.isArray(data) ? data.length : 0);
      console.log('First few sales:', Array.isArray(data) ? data.slice(0, 2) : data);
      console.log('Setting salesHistory state to:', Array.isArray(data) ? data : []);
      setSalesHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showToast('Failed to load sales history: ' + error.message, 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [showToast]);
  // Effect to fetch history when view or filters change
  useEffect(() => {
    if (currentView === 'history') {
      console.log('History view - fetching sales with filters:', { historyDate, historyBranch });
      fetchSalesHistory(historyDate, historyBranch);
    }
  }, [currentView, historyDate, historyBranch, fetchSalesHistory]);

  // Log when salesHistory changes
  useEffect(() => {
    console.log('salesHistory state changed, new length:', salesHistory.length);
    if (salesHistory.length > 0) {
      console.log('First sale in state:', salesHistory[0]);
    }
  }, [salesHistory]);

  // Receipt modal is implemented to not block body scroll; no body overflow changes needed

  // Handler for filter changes
  const handleHistoryFilterChange = (date, branch) => {
    setHistoryDate(date);
    setHistoryBranch(branch);
    // Fetch with new filters
    fetchSalesHistory(date, branch);
  };

  const addToCart = (item, type) => {
    // For solo services with both pricing options, open modal to choose type
    if (type === 'service' && item.is_solo && item.can_be_addon && parseFloat(item.addon_price) > 0 && parseFloat(item.standalone_price) > 0) {
      setServiceTypeModal({
        isOpen: true,
        service: item,
        serviceType: null
      });
      return;
    }

    // Determine the correct price based on service type
    let price;
    if (type === 'service') {
      // Package services (is_solo = false)
      if (!item.is_solo) {
        price = item.has_sizes ? parseFloat(item.medium_price) : parseFloat(item.base_price);
      }
      // Solo services with only standalone price
      else if (item.is_solo && item.can_be_standalone && parseFloat(item.standalone_price) > 0) {
        price = parseFloat(item.standalone_price);
      }
      // Solo services with only addon price
      else if (item.is_solo && item.can_be_addon && parseFloat(item.addon_price) > 0) {
        price = parseFloat(item.addon_price);
      }
      // Fallback to base price
      else {
        price = parseFloat(item.base_price) || 0;
      }
    } else {
      // Products use retail_price, fallback to unit_cost
      price = parseFloat(item.retail_price || item.unit_cost);
    }

    const cartItem = {
      id: `${type}-${item.id}`,
      type,
      product_id: type === 'product' ? item.id : null,
      service_id: type === 'service' ? item.id : null,
      name: type === 'product' ? item.name : item.service_name,
      price: price,
      quantity: 1,
      service_size: 'M'
    };

    const existingItem = cart.find(c => c.id === cartItem.id);
    if (existingItem) {
      existingItem.quantity += 1;
      setCart([...cart]);
    } else {
      setCart([...cart, cartItem]);
    }

    showToast(`${cartItem.name} added to cart`, 'success');
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleServiceTypeSelection = (serviceType) => {
    if (!serviceTypeModal.service) return;

    const item = serviceTypeModal.service;
    let price;

    if (serviceType === 'solo') {
      price = parseFloat(item.standalone_price) || 0;
    } else {
      price = parseFloat(item.addon_price) || 0;
    }

    const cartItem = {
      id: `service-${item.id}-${serviceType}`,
      type: 'service',
      product_id: null,
      service_id: item.id,
      name: `${item.service_name} (${serviceType === 'solo' ? 'Solo Service' : 'Add-on'})`,
      price: price,
      quantity: 1,
      service_size: 'M',
      serviceType: serviceType
    };

    const existingItem = cart.find(c => c.id === cartItem.id);
    if (existingItem) {
      existingItem.quantity += 1;
      setCart([...cart]);
    } else {
      setCart([...cart, cartItem]);
    }

    showToast(`${cartItem.name} added to cart`, 'success');
    setServiceTypeModal({ isOpen: false, service: null, serviceType: null });
  };

  const updateQuantity = (itemId, quantity) => {
    const item = cart.find(c => c.id === itemId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      setCart([...cart]);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = parseFloat(discount) || 0;
    const taxable = subtotal - discountAmount;
    const tax = taxable * 0.12;
    const total = taxable + tax;
    const change = (parseFloat(amountPaid) || 0) - total;

    return { subtotal, discountAmount, taxable, tax, total, change };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }

    // Open checkout modal
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = async () => {
    if (!customerName.trim()) {
      showToast('Please enter customer name', 'warning');
      return;
    }

    if (!amountPaid) {
      showToast('Please enter amount paid', 'warning');
      return;
    }

    const { total } = calculateTotals();
    if (parseFloat(amountPaid) < total) {
      showToast('Amount paid is less than total', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const saleData = {
        customer_name: customerName,
        customer_phone: customerPhone || '',
        customer_email: customerEmail && customerEmail.trim() ? customerEmail : '',
        branch: selectedBranch,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid),
        discount: parseFloat(discount) || 0,
        notes: notes || '',
        items: cart.map(item => {
          const itemData = {
            item_type: item.type,
            quantity: item.quantity.toString(),
            unit_price: item.price.toString()
          };
          
          if (item.type === 'product') {
            itemData.product_id = item.product_id;
          } else if (item.type === 'service') {
            itemData.service_id = item.service_id;
            itemData.service_size = item.service_size || '';
          }
          
          return itemData;
        })
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/sales/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Backend validation errors:', error);
        throw new Error(error.error || JSON.stringify(error) || 'Failed to create sale');
      }

      await response.json();

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setAmountPaid('');
      setDiscount('0');
      setNotes('');

      showToast('Sale completed successfully!', 'success');

      // Close modal
      setCheckoutModalOpen(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      showToast(error.message || 'Failed to create sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const { subtotal, discountAmount, tax, total, change } = calculateTotals();

  if (!user || !user.is_staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-darker py-8">
      <Toast {...toast} />

      {/* Service Type Selection Modal */}
      {serviceTypeModal.isOpen && serviceTypeModal.service && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
          <div ref={serviceTypeModalRef} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-primary-darker mb-4">
              How would you like to add {serviceTypeModal.service.service_name}?
            </h2>
            <p className="text-gray-600 mb-6">This service can be purchased as a solo service or add-on. Choose one:</p>
            
            <div className="space-y-4">
              {parseFloat(serviceTypeModal.service.standalone_price) > 0 && (
                <button
                  onClick={() => handleServiceTypeSelection('solo')}
                  className="w-full p-4 border-2 border-blue-300 rounded-3xl hover:bg-blue-50 transition-colors text-left"
                >
                  <p className="font-bold text-primary-darker">Solo Service</p>
                  <p className="text-lg text-blue-600 font-semibold">{formatCurrency(parseFloat(serviceTypeModal.service.standalone_price))}</p>
                </button>
              )}
              
              {parseFloat(serviceTypeModal.service.addon_price) > 0 && (
                <button
                  onClick={() => handleServiceTypeSelection('addon')}
                  className="w-full p-4 border-2 border-purple-300 rounded-3xl hover:bg-purple-50 transition-colors text-left"
                >
                  <p className="font-bold text-primary-darker">Add-on</p>
                  <p className="text-lg text-purple-600 font-semibold">{formatCurrency(parseFloat(serviceTypeModal.service.addon_price))}</p>
                </button>
              )}
            </div>

            <button
              onClick={() => setServiceTypeModal({ isOpen: false, service: null, serviceType: null })}
              className="w-full mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded-3xl hover:bg-gray-400 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-accent-cream">💰 Sales & POS System</h1>
            <p className="text-accent-peach text-lg mt-1">Professional Point of Sale</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('pos')}
              className={`px-6 py-3 rounded-3xl font-semibold transition-all ${
                currentView === 'pos'
                  ? 'bg-secondary text-accent-cream shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              💰 POS
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-6 py-3 rounded-3xl font-semibold transition-all ${
                currentView === 'history'
                  ? 'bg-secondary text-accent-cream shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaClock className="inline mr-2" /> History
            </button>
          </div>
        </div>

        {/* POS View */}
        {currentView === 'pos' && (
          <div className="space-y-6">

            {/* Main POS Grid: Left = Products/Services/Addons (larger), Right = Cart (smaller) */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* Left Side: Products, Package Services, Solo Services & Add-ons */}
              <div className="space-y-6">
                {/* Products */}
                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <div className="flex items-center mb-4 gap-2">
                    <h2 className="text-2xl font-bold text-primary-darker flex items-center gap-2">
                      <FaBox className="text-secondary" /> Products
                    </h2>
                    <select
                      className="ml-2 px-3 py-1 border border-gray-300 rounded-3xl text-sm focus:ring-2 focus:ring-secondary"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {[...new Set(products.map(p => p.category).filter(Boolean))].sort().map(category => (
                        <option key={category} value={category.toLowerCase()}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {products
                      .filter(p => selectedCategory === 'all' || (p.category && p.category.toLowerCase() === selectedCategory))
                      .map(product => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product, 'product')}
                          className="p-2 border border-gray-200 rounded-3xl hover:border-secondary hover:bg-gray-50 transition-all text-left"
                        >
                          <p className="font-semibold text-primary-darker text-xs">{product.name}</p>
                          <p className="text-xs text-gray-500">Stock: {product.quantity}</p>
                          <p className="font-bold text-secondary text-xs mt-1">{formatCurrency(parseFloat(product.retail_price || product.unit_cost))}</p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Package Services */}
                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <h2 className="text-2xl font-bold text-primary-darker mb-4">📦 Package Services</h2>
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {services
                      .filter(s => !s.is_solo)
                      .map(service => {
                        const price = service.has_sizes ? service.medium_price : service.base_price;
                        return (
                          <button
                            key={service.id}
                            onClick={() => addToCart(service, 'service')}
                            className="p-2 border border-brand-gold rounded-3xl hover:border-secondary hover:bg-yellow-50 transition-all text-left"
                          >
                            <p className="font-semibold text-primary-darker text-xs">{service.service_name}</p>
                            {service.has_sizes && <p className="text-xs text-gray-500">Medium</p>}
                            <p className="font-bold text-secondary text-xs mt-1">{formatCurrency(parseFloat(price))}</p>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Solo Services & Add-ons */}
                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <h2 className="text-2xl font-bold text-primary-darker mb-4">✨ Solo Services & Add-ons</h2>
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {services
                      .filter(s => s.is_solo)
                      .map(service => {
                        const standalonePrice = parseFloat(service.standalone_price) || parseFloat(service.base_price) || 0;
                        const addonPrice = parseFloat(service.addon_price) || 0;
                        
                        return (
                          <button
                            key={service.id}
                            onClick={() => addToCart(service, 'service')}
                            className="p-2 border border-blue-300 rounded-3xl hover:border-secondary hover:bg-blue-50 transition-all text-left"
                          >
                            <p className="font-semibold text-primary-darker text-xs">{service.service_name}</p>
                            <div className="text-xs mt-0.5 space-y-0.5">
                              {service.is_solo && service.can_be_standalone && (
                                <p className="text-blue-600 text-xs">Solo: {formatCurrency(standalonePrice)}</p>
                              )}
                              {service.can_be_addon && (
                                <p className="text-purple-600 text-xs">Add-on: {formatCurrency(addonPrice)}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Right Side: Cart & Checkout */}
              <div className="bg-white rounded-3xl shadow-2xl p-4 space-y-4 lg:max-w-xs lg:w-full">
                <h2 className="text-2xl font-bold text-primary-darker flex items-center gap-2">
                  <FaShoppingCart /> Cart ({cart.length})
                </h2>

                {/* Cart Items List */}
                <div className="bg-gray-50 rounded-3xl p-4 max-h-96 overflow-y-auto space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Cart is empty</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded border-l-4 border-secondary">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <FaMinus size={12} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="w-12 text-center border border-gray-300 rounded px-1"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>
                        <p className="text-right font-bold text-secondary">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-3xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT_Tax:</span>
                    <span className="font-semibold text-secondary">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary-darker border-t-2 pt-2">
                    <span>Total:</span>
                    <span className="text-secondary">{formatCurrency(total)}</span>
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between text-lg font-bold bg-green-100 p-2 rounded text-green-700">
                      <span>Change:</span>
                      <span>{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={submitting || cart.length === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-3xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <FaCheckCircle /> {submitting ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-primary-darker flex items-center gap-2">
              <FaClock /> Sales History
            </h2>
            
            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <p className="text-sm text-gray-600 mb-4">Filter transactions (optional)</p>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Filter by Date</label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => handleHistoryFilterChange(e.target.value, historyBranch)}
                    className="px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Filter by Branch</label>
                  <select
                    value={historyBranch}
                    onChange={(e) => handleHistoryFilterChange(historyDate, e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Branches</option>
                    <option value="Matina">Matina</option>
                    <option value="Toril">Toril</option>
                  </select>
                </div>
                {(historyDate || historyBranch !== 'all') && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        handleHistoryFilterChange('', 'all');
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-3xl hover:bg-red-600 font-semibold"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sales List */}
            {historyLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                <p className="text-gray-600 mt-4">Loading sales history...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Debug info */}
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Sales history count: {salesHistory.length}
                </div>
                {salesHistory.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center">
                    <p className="text-gray-500 text-lg">No sales found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
                  </div>
                ) : (
                  salesHistory.map(sale => (
                    <div key={sale.id} className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Sale #</p>
                          <p className="font-bold text-primary-darker">{sale.sale_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Customer</p>
                          <p className="font-bold text-primary-darker">{sale.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Branch</p>
                          <p className="font-bold text-primary-darker">{sale.branch}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total</p>
                          <p className="font-bold text-secondary text-lg">{formatCurrency(parseFloat(sale.total))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Time</p>
                          <p className="font-bold text-primary-darker">{new Date(sale.sale_date).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <p className="text-sm text-gray-600">Items: {sale.items.length} | Payment: {sale.payment_method}</p>
                        <button
                          onClick={() => {
                            setReceiptData(sale);
                            setReceiptModalOpen(true);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 font-semibold text-sm transition-colors"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Checkout Modal */}
        {checkoutModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 z-50">
            <div ref={checkoutModalRef} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full h-[95vh] max-h-[95vh] flex flex-col overflow-hidden">
              <h2 className="text-2xl font-bold text-primary-darker mb-6 flex-shrink-0">Payment Details</h2>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Cart Summary */}
              <div className="bg-gray-50 rounded-3xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT_Tax:</span>
                  <span className="font-semibold text-secondary">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary-darker border-t-2 pt-2">
                  <span>Total:</span>
                  <span className="text-secondary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  />
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  >
                    <option value="Matina">Matina</option>
                    <option value="Toril">Toril</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount Paid *</label>
                  <input
                    type="number"
                    placeholder="Enter amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (optional)</label>
                  <input
                    type="number"
                    placeholder="Enter discount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    placeholder="Additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-secondary text-sm"
                  />
                </div>
              </div>
              </div>

              {/* Modal Actions - Sticky at Bottom */}
              <div className="flex gap-3 pt-4 mt-auto border-t flex-shrink-0">
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-3xl hover:bg-gray-400 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckoutSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-3xl hover:shadow-lg disabled:opacity-50 font-bold transition-all flex items-center justify-center gap-2"
                >
                  <FaCheckCircle /> {submitting ? 'Processing...' : 'Pay'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        <SalesReceiptModal 
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setReceiptData(null);
          }}
          receiptData={receiptData && { type: 'sale', data: receiptData }}
        />
      </div>
    </div>
  );
}
