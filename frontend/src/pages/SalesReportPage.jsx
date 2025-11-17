import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaFilter, FaCalendar } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/formatters';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper function to make API calls with token refresh
const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem('access') || sessionStorage.getItem('access');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // If 401 Unauthorized, try to refresh token
  if (response.status === 401) {
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
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  return response;
};

export default function SalesReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [productTransactions, setProductTransactions] = useState([]);
  const [serviceTransactions, setServiceTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Format: YYYY-MM
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'transactions'
  const itemsPerPage = 6;

  // Fetch sales data on mount and when filters change
  useEffect(() => {
    if (user && user.is_staff) {
      fetchSalesData();
    } else if (user && !user.is_staff) {
      toast.showToast('Admin access required', 'error');
      navigate('/products');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedMonth, selectedBranch]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Helper to safely parse prices
      const safeParseFloat = (value) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Convert month (YYYY-MM) to date range
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      const products = [];
      const services = [];
      const allBranches = new Set();

      // ===== Fetch POS Sales =====
      const salesParams = new URLSearchParams();
      salesParams.append('status', 'completed');
      if (selectedBranch !== 'all') {
        salesParams.append('branch', selectedBranch);
      }

      const salesResponse = await fetchWithAuth(`${API_BASE_URL}/sales/?${salesParams}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        const filteredSales = salesData.filter(sale => {
          const saleDate = new Date(sale.sale_date).toISOString().split('T')[0];
          return saleDate >= startDate && saleDate <= endDate;
        });

        filteredSales.forEach(sale => {
          allBranches.add(sale.branch);
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              const transactionBase = {
                transactionId: `SALE-${sale.id}`,
                transactionNumber: sale.sale_number || `SALE-${sale.id}`,
                customerName: sale.customer_name || 'Unknown Customer',
                customerPhone: sale.customer_phone || '',
                customerEmail: sale.customer_email || '',
                branch: sale.branch || 'Unknown Branch',
                paymentMethod: sale.payment_method || 'Unknown',
                transactionDate: sale.sale_date,
                quantity: parseInt(item.quantity) || 0,
                unitPrice: safeParseFloat(item.unit_price),
                subtotal: safeParseFloat(item.subtotal),
                source: 'POS',
                orderStatus: sale.status || 'completed',
              };

              if (item.item_type === 'product') {
                products.push({
                  ...transactionBase,
                  itemName: item.item_name || 'Unknown Product',
                });
              } else if (item.item_type === 'service') {
                services.push({
                  ...transactionBase,
                  itemName: item.item_name || 'Unknown Service',
                });
              }
            });
          }
        });
      }

      // ===== Fetch ALL Orders (Product Orders) - Convert to Sales =====
      const ordersResponse = await fetchWithAuth(`${API_BASE_URL}/orders/admin/all/`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const filteredOrders = ordersData.filter(order => {
          const orderDate = new Date(order.completed_at || order.created_at).toISOString().split('T')[0];
          const isInDateRange = orderDate >= startDate && orderDate <= endDate;
          const isInBranch = selectedBranch === 'all' || order.branch === selectedBranch;
          return isInDateRange && isInBranch;
        });

        filteredOrders.forEach(order => {
          allBranches.add(order.branch);
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              // Generate proper transaction number like Sales: ORDER-YYYYMMDD-XXXX
              const orderDate = new Date(order.completed_at || order.created_at);
              const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
              const orderId = order.order_id || `ORD${order.id}`;
              const transactionNumber = `ORDER-${dateStr}-${orderId}`;

              const itemPrice = safeParseFloat(item.price);
              const itemQuantity = parseInt(item.quantity) || 0;
              const itemSubtotal = itemPrice * itemQuantity;

              const transactionBase = {
                transactionId: `ORDER-${order.id}`,
                transactionNumber: transactionNumber,
                customerName: (order.user?.first_name || order.user?.username || 'Unknown Customer'),
                customerPhone: order.user?.email || '',
                customerEmail: order.user?.email || '',
                branch: order.branch || 'Unknown Branch',
                paymentMethod: 'Online Order',
                transactionDate: order.completed_at || order.created_at,
                quantity: itemQuantity,
                unitPrice: itemPrice,
                subtotal: itemSubtotal,
                source: 'PRODUCT ORDER',
                orderStatus: order.status || 'pending',
                amountPaid: safeParseFloat(order.amount_paid),
                change: safeParseFloat(order.change),
              };

              if (item.item_type === 'product') {
                products.push({
                  ...transactionBase,
                  itemName: item.item_name || item.product_details?.name || 'Unknown Product',
                });
              } else if (item.item_type === 'service') {
                services.push({
                  ...transactionBase,
                  itemName: item.item_name || item.service_details?.name || 'Unknown Service',
                });
              }
            });
          }
        });
      }

      // ===== Fetch Appointments (Service Appointments) =====
      const appointmentsParams = new URLSearchParams();
      appointmentsParams.append('status', 'completed');
      if (selectedBranch !== 'all') {
        appointmentsParams.append('branch', selectedBranch);
      }

      const appointmentsResponse = await fetchWithAuth(`${API_BASE_URL}/appointments/admin/all/?${appointmentsParams}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        const filteredAppointments = appointmentsData.filter(apt => {
          const aptDate = new Date(apt.updated_at).toISOString().split('T')[0];
          return aptDate >= startDate && aptDate <= endDate;
        });

        filteredAppointments.forEach(apt => {
          allBranches.add(apt.branch);
          
          // Helper to calculate service price based on size-based or standalone pricing
          const getServicePrice = (service, petWeight = 20) => {
            if (!service) return 0;
            
            // If service has size-based pricing, calculate based on pet weight
            if (service.has_sizes) {
              const weight = petWeight || 20; // Default to medium
              if (weight <= 10) return safeParseFloat(service.small_price);
              if (weight <= 25) return safeParseFloat(service.medium_price);
              if (weight <= 50) return safeParseFloat(service.large_price);
              return safeParseFloat(service.extra_large_price);
            }
            // Otherwise use standalone_price or base_price
            return safeParseFloat(service.standalone_price || service.base_price);
          };
          
          // Main service
          const petWeight = apt.pet_details?.weight_lbs || 20;
          const servicePrice = getServicePrice(apt.service_details, petWeight);
          
          services.push({
            transactionId: `APT-${apt.id}`,
            transactionNumber: `APT-${apt.id || 'N/A'}`,
            customerName: apt.user_details?.first_name && apt.user_details?.last_name 
              ? `${apt.user_details.first_name} ${apt.user_details.last_name}`.trim()
              : apt.user_details?.username || 'Unknown Customer',
            customerPhone: apt.user_details?.phone || '',
            customerEmail: apt.user_details?.email || '',
            branch: apt.branch || 'Unknown Branch',
            paymentMethod: 'Appointment',
            transactionDate: apt.updated_at,
            quantity: 1,
            unitPrice: servicePrice,
            subtotal: servicePrice,
            source: 'APPOINTMENT',
            itemName: apt.service_details?.service_name || 'Unknown Service',
            orderStatus: apt.status || 'completed',
          });

          // Add-ons
          if (apt.add_ons && Array.isArray(apt.add_ons) && apt.add_ons.length > 0) {
            apt.add_ons.forEach(addon => {
              const addonPrice = safeParseFloat(addon.addon_price ?? addon.standalone_price ?? addon.base_price);
              services.push({
                transactionId: `APT-${apt.id}-ADDON`,
                transactionNumber: `APT-${apt.id || 'N/A'}`,
                customerName: apt.user_details?.first_name && apt.user_details?.last_name 
                  ? `${apt.user_details.first_name} ${apt.user_details.last_name}`.trim()
                  : apt.user_details?.username || 'Unknown Customer',
                customerPhone: apt.user_details?.phone || '',
                customerEmail: apt.user_details?.email || '',
                branch: apt.branch || 'Unknown Branch',
                paymentMethod: 'Appointment',
                transactionDate: apt.updated_at,
                quantity: 1,
                unitPrice: addonPrice,
                subtotal: addonPrice,
                source: 'APPOINTMENT + ADD-ONS',
                itemName: `${addon.service_name || 'Unknown'} (Add-on)`,
                orderStatus: apt.status || 'completed',
              });
            });
          }
        });
      }

      setProductTransactions(products);
      setServiceTransactions(services);
      setBranches(Array.from(allBranches));
      
      // Debug logging
      console.log('Sales Report Data Loaded:');
      console.log('Products:', products.length, products);
      console.log('Services:', services.length, services);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.showToast('Failed to load sales report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotals = (transactions) => {
    return {
      totalQuantity: transactions.reduce((sum, t) => sum + t.quantity, 0),
      totalSubtotal: transactions.reduce((sum, t) => sum + t.subtotal, 0),
    };
  };

  // Calculate KPIs and analytics
  const calculateAnalytics = (products, services) => {
    const allTransactions = [...products, ...services];
    
    // Safely calculate totals, handling NaN and undefined values
    const totalRevenue = allTransactions.reduce((sum, t) => {
      const subtotal = parseFloat(t.subtotal) || 0;
      return sum + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
    
    const totalTransactions = allTransactions.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Top products
    const productSales = {};
    products.forEach(p => {
      if (!productSales[p.itemName]) {
        productSales[p.itemName] = { quantity: 0, revenue: 0, count: 0 };
      }
      productSales[p.itemName].quantity += (parseInt(p.quantity) || 0);
      productSales[p.itemName].revenue += (parseFloat(p.subtotal) || 0);
      productSales[p.itemName].count += 1;
    });
    
    // Top services
    const serviceSales = {};
    services.forEach(s => {
      if (!serviceSales[s.itemName]) {
        serviceSales[s.itemName] = { quantity: 0, revenue: 0, count: 0 };
      }
      serviceSales[s.itemName].quantity += (parseInt(s.quantity) || 0);
      serviceSales[s.itemName].revenue += (parseFloat(s.subtotal) || 0);
      serviceSales[s.itemName].count += 1;
    });
    
    // Top products and services
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
    
    const topServices = Object.entries(serviceSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
    
    // Sales by source
    const salesBySource = {};
    allTransactions.forEach(t => {
      if (!salesBySource[t.source]) {
        salesBySource[t.source] = { count: 0, revenue: 0 };
      }
      salesBySource[t.source].count += 1;
      salesBySource[t.source].revenue += (parseFloat(t.subtotal) || 0);
    });
    
    // Sales by branch
    const salesByBranch = {};
    allTransactions.forEach(t => {
      if (!salesByBranch[t.branch]) {
        salesByBranch[t.branch] = { count: 0, revenue: 0 };
      }
      salesByBranch[t.branch].count += 1;
      salesByBranch[t.branch].revenue += (parseFloat(t.subtotal) || 0);
    });
    
    // Ensure totalRevenue is a valid number
    const validTotalRevenue = isNaN(totalRevenue) ? 0 : totalRevenue;
    
    return {
      totalRevenue: validTotalRevenue,
      totalTransactions,
      averageOrderValue: isNaN(averageOrderValue) ? 0 : averageOrderValue,
      topProducts,
      topServices,
      salesBySource,
      salesByBranch,
    };
  };

  const productTotals = calculateTotals(productTransactions);
  const serviceTotals = calculateTotals(serviceTransactions);
  const analytics = calculateAnalytics(productTransactions, serviceTransactions);

  if (!user || !user.is_staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-darker py-8">
      <Toast />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:shadow-none">
          <div className="flex items-center justify-between mb-4 print:mb-2">
            <div>
              <h1 className="heading-main text-primary-darker">Sales Report</h1>
              <p className="text-sm text-gray-600 mt-1">Complete Transaction Summary</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light font-medium text-sm transition-colors"
              >
                <FaPrint /> Print Report
              </button>
              <button
                onClick={() => navigate('/admin/end-of-day-reports')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition-colors"
              >
                <FaCalendar /> End of Day Reports
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" /> Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
              <p className="text-gray-600">Loading sales data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex gap-4 border-b border-gray-200 print:hidden">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 font-semibold text-base transition-all ${
                    activeTab === 'analytics'
                      ? 'text-secondary border-b-2 border-secondary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-6 py-3 font-semibold text-base transition-all ${
                    activeTab === 'transactions'
                      ? 'text-secondary border-b-2 border-secondary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transactions
                </button>
              </div>
            </div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-8 mb-8">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-600 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {formatCurrency(analytics.totalRevenue)}
                      </p>
                    </div>
                    <div className="text-4xl text-purple-200">₱</div>
                  </div>
                </div>

                {/* Total Transactions */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-600 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {analytics.totalTransactions}
                      </p>
                    </div>
                    <div className="text-4xl text-blue-200">#</div>
                  </div>
                </div>

                {/* Average Order Value */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-600 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Average Order Value</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {formatCurrency(analytics.averageOrderValue)}
                      </p>
                    </div>
                    <div className="text-4xl text-green-200">Ø</div>
                  </div>
                </div>

                {/* Product Transactions Count */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-l-4 border-orange-600 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Product Sales</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">
                        {productTransactions.length}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{formatCurrency(productTotals.totalSubtotal)}</p>
                    </div>
                    <div className="text-4xl text-orange-200">📦</div>
                  </div>
                </div>
              </div>

              {/* Sales by Source and Branch */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                {/* Sales by Source - Pie Chart */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sales by Source</h3>
                  <div className="flex justify-center">
                    <svg viewBox="0 0 200 200" width="200" height="200" className="mb-4">
                      {(() => {
                        const entries = Object.entries(analytics.salesBySource);
                        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                        let currentAngle = -Math.PI / 2;
                        
                        return entries.map(([source, data], idx) => {
                          const sliceAngle = (data.revenue / analytics.totalRevenue) * 2 * Math.PI;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + sliceAngle;
                          
                          const x1 = 100 + 80 * Math.cos(startAngle);
                          const y1 = 100 + 80 * Math.sin(startAngle);
                          const x2 = 100 + 80 * Math.cos(endAngle);
                          const y2 = 100 + 80 * Math.sin(endAngle);
                          const largeArc = sliceAngle > Math.PI ? 1 : 0;
                          
                          const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          
                          // Calculate label position
                          const labelAngle = startAngle + sliceAngle / 2;
                          const labelRadius = 55;
                          const labelX = 100 + labelRadius * Math.cos(labelAngle);
                          const labelY = 100 + labelRadius * Math.sin(labelAngle);
                          const percentage = ((data.revenue / analytics.totalRevenue) * 100).toFixed(1);
                          
                          // Dynamically adjust font size based on slice size
                          let fontSize = 12;
                          if (sliceAngle < Math.PI / 6) fontSize = 7;    // Small slice
                          else if (sliceAngle < Math.PI / 4) fontSize = 8;  // Medium-small slice
                          else if (sliceAngle < Math.PI / 3) fontSize = 10; // Medium slice
                          
                          currentAngle = endAngle;
                          
                          return (
                            <g key={idx}>
                              <path d={path} fill={colors[idx % colors.length]} stroke="white" strokeWidth="2" />
                              {sliceAngle > Math.PI / 12 && (
                                <text
                                  x={labelX}
                                  y={labelY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize={fontSize}
                                  fontWeight="bold"
                                  fill="white"
                                >
                                  {percentage}%
                                </text>
                              )}
                            </g>
                          );
                        });
                      })()}
                    </svg>
                  </div>
                  <div className="mt-6">
                    <div className="flex flex-col gap-2">
                      {Object.entries(analytics.salesBySource).map(([source, data], idx) => {
                        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                        return (
                          <div key={source} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded flex-shrink-0"
                              style={{ backgroundColor: colors[idx % colors.length] }}
                            ></div>
                            <span className="text-xs text-gray-700 font-medium">{source}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sales by Branch */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sales by Branch</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.salesByBranch).map(([branch, data]) => (
                      <div key={branch} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-800">{branch}</p>
                          <p className="text-sm text-gray-600">{data.count} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(data.revenue)}</p>
                          <p className="text-xs text-gray-600">
                            {((data.revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Products and Services */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Products</h3>
                  <div className="space-y-3">
                    {analytics.topProducts.length > 0 ? (
                      analytics.topProducts.map((product, idx) => (
                        <div key={idx} className="flex items-start justify-between pb-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 truncate">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.quantity} units • {product.count} transactions</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No product sales</p>
                    )}
                  </div>
                </div>

                {/* Top Services - Vertical Bar Chart */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Services</h3>
                  {analytics.topServices.length > 0 ? (
                    <div className="space-y-4">
                      <div className="w-full overflow-x-auto">
                        <svg viewBox="0 0 450 300" width="450" height="300" className="min-w-max">
                          {(() => {
                            const services = analytics.topServices.slice(0, 5);
                            const maxRevenue = Math.max(...(services?.map(s => s.revenue) || [1]));
                            const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                            const margin = { top: 20, right: 10, bottom: 40, left: 50 };
                            const chartWidth = 450 - margin.left - margin.right;
                            const chartHeight = 300 - margin.top - margin.bottom;
                            const barWidth = chartWidth / (services.length * 1.5);
                            const barSpacing = chartWidth / services.length;
                            
                            return (
                              <>
                                {/* Y-axis */}
                                <line
                                  x1={margin.left}
                                  y1={margin.top}
                                  x2={margin.left}
                                  y2={margin.top + chartHeight}
                                  stroke="#333"
                                  strokeWidth="2"
                                />
                                
                                {/* X-axis */}
                                <line
                                  x1={margin.left}
                                  y1={margin.top + chartHeight}
                                  x2={450 - margin.right}
                                  y2={margin.top + chartHeight}
                                  stroke="#333"
                                  strokeWidth="2"
                                />
                                
                                {/* Y-axis labels and gridlines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                  const value = maxRevenue * ratio;
                                  const y = margin.top + chartHeight - (ratio * chartHeight);
                                  return (
                                    <g key={`y-${idx}`}>
                                      {/* Gridline */}
                                      <line
                                        x1={margin.left}
                                        y1={y}
                                        x2={450 - margin.right}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                        strokeDasharray="4"
                                      />
                                      {/* Y-axis label */}
                                      <text
                                        x={margin.left - 8}
                                        y={y + 4}
                                        textAnchor="end"
                                        fontSize="11"
                                        fill="#666"
                                      >
                                        ₱{(value / 1000).toFixed(0)}k
                                      </text>
                                    </g>
                                  );
                                })}
                                
                                {/* Bars */}
                                {services.map((service, idx) => {
                                  const barHeight = (service.revenue / maxRevenue) * chartHeight;
                                  const x = margin.left + idx * barSpacing + (barSpacing - barWidth) / 2;
                                  const y = margin.top + chartHeight - barHeight;
                                  
                                  return (
                                    <g key={`bar-${idx}`}>
                                      <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        fill={colors[idx % colors.length]}
                                        rx="4"
                                        className="hover:opacity-80 transition-opacity"
                                      />
                                      {/* Revenue value on top of bar */}
                                      <text
                                        x={x + barWidth / 2}
                                        y={y - 5}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fontWeight="bold"
                                        fill="#333"
                                      >
                                        ₱{(service.revenue / 1000).toFixed(1)}k
                                      </text>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex flex-col gap-2">
                        {analytics.topServices.slice(0, 5).map((service, idx) => {
                          const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded flex-shrink-0"
                                style={{ backgroundColor: colors[idx % colors.length] }}
                              ></div>
                              <span className="text-xs text-gray-700 font-medium">{service.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No service sales</p>
                  )}
                </div>
              </div>
            </div>
            </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
            <div className="space-y-8">
            {/* Products Transactions Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">
                  Product Transactions ({productTransactions.length})
                </h2>
              </div>

              {productTransactions.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <div style={{ minHeight: '336px', display: 'flex', flexDirection: 'column' }}>
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Trans. #</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Product Name</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Source</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Customer</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Branch</th>
                            <th className="px-3 py-4 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Quantity</th>
                            <th className="px-3 py-4 text-right text-sm font-semibold text-gray-700 border-r border-gray-300">Unit Price</th>
                            <th className="px-3 py-4 text-right text-sm font-semibold text-gray-700 border-r border-gray-300">Subtotal</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Payment Method</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Status</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productTransactions
                            .slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage)
                            .map((transaction, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-200 hover:bg-blue-50 transition-colors print:border-gray-300"
                            >
                              <td className="px-3 py-4 text-sm font-medium text-primary-darker border-r border-gray-200">
                                {transaction.transactionNumber || 'N/A'}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">{transaction.itemName || 'Unknown Product'}</td>
                              <td className="px-3 py-4 text-sm border-r border-gray-200">
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 whitespace-nowrap inline-block">
                                  {transaction.source || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">
                                {transaction.customerName || 'Unknown Customer'}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">{transaction.branch || 'Unknown Branch'}</td>
                              <td className="px-3 py-4 text-sm text-center font-medium text-gray-700 border-r border-gray-200">
                                {transaction.quantity || 0}
                              </td>
                              <td className="px-3 py-4 text-sm font-medium text-gray-700 text-right border-r border-gray-200">
                                {transaction.unitPrice ? formatCurrency(transaction.unitPrice) : formatCurrency(0)}
                              </td>
                              <td className="px-3 py-4 text-sm font-bold text-blue-600 text-right border-r border-gray-200">
                                {transaction.subtotal ? formatCurrency(transaction.subtotal) : formatCurrency(0)}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 capitalize border-r border-gray-200">
                                {transaction.paymentMethod || 'Unknown'}
                              </td>
                              <td className="px-3 py-4 text-sm border-r border-gray-200">
                                {transaction.orderStatus ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    transaction.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    transaction.orderStatus === 'available_for_pickup' ? 'bg-yellow-100 text-yellow-800' :
                                    transaction.orderStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {transaction.orderStatus.replace('_', ' ')}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                    Completed
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-600">
                                {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50 border-t-2 border-blue-600 font-bold">
                          <tr>
                            <td colSpan="6" className="px-3 py-4 text-right">
                              PRODUCT TOTALS:
                            </td>
                            <td className="px-3 py-4 text-center text-blue-600 border-r border-gray-300">
                              {productTotals.totalQuantity || 0}
                            </td>
                            <td className="px-3 py-4 text-right border-r border-gray-300">-</td>
                            <td className="px-3 py-4 text-right text-blue-600 border-r border-gray-300">
                              {productTotals.totalSubtotal ? formatCurrency(productTotals.totalSubtotal) : formatCurrency(0)}
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  
                  {/* Product Pagination Controls */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Page {productPage} of {Math.ceil(productTransactions.length / itemsPerPage)} | Total: {productTransactions.length} transactions
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setProductPage(Math.max(1, productPage - 1))}
                        disabled={productPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setProductPage(Math.min(Math.ceil(productTransactions.length / itemsPerPage), productPage + 1))}
                        disabled={productPage === Math.ceil(productTransactions.length / itemsPerPage)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
                <div className="px-8 py-12 text-center text-gray-500">
                  <p>No product transactions found for the selected period.</p>
                </div>
              )}
            </div>

            {/* Services Transactions Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">
                  Service Transactions ({serviceTransactions.length})
                </h2>
              </div>

              {serviceTransactions.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <div style={{ minHeight: '336px', display: 'flex', flexDirection: 'column' }}>
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Trans. #</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Service Name</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Source</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Customer</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Branch</th>
                            <th className="px-3 py-4 text-right text-sm font-semibold text-gray-700 border-r border-gray-300">Service Price</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Type</th>
                            <th className="px-3 py-4 text-right text-sm font-semibold text-gray-700 border-r border-gray-300">Total</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Payment Method</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Status</th>
                            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceTransactions
                            .slice((servicePage - 1) * itemsPerPage, servicePage * itemsPerPage)
                            .map((transaction, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-200 hover:bg-green-50 transition-colors print:border-gray-300"
                            >
                              <td className="px-3 py-4 text-sm font-medium text-primary-darker border-r border-gray-200">
                                {transaction.transactionNumber || 'N/A'}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">{transaction.itemName || 'Unknown Service'}</td>
                              <td className="px-3 py-4 text-sm border-r border-gray-200">
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 whitespace-nowrap inline-block">
                                  {transaction.source || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">
                                {transaction.customerName || 'Unknown Customer'}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">{transaction.branch || 'Unknown Branch'}</td>
                              <td className="px-3 py-4 text-sm font-medium text-gray-700 text-right border-r border-gray-200">
                                {transaction.unitPrice ? formatCurrency(transaction.unitPrice) : formatCurrency(0)}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 border-r border-gray-200">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${
                                  (transaction.itemName || '').includes('Add-on') 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {(transaction.itemName || '').includes('Add-on') ? 'Add-On' : 'Solo Service'}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm font-bold text-green-600 text-right border-r border-gray-200">
                                {transaction.subtotal ? formatCurrency(transaction.subtotal) : formatCurrency(0)}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-700 capitalize border-r border-gray-200">
                                {transaction.paymentMethod || 'Unknown'}
                              </td>
                              <td className="px-3 py-4 text-sm border-r border-gray-200">
                                {transaction.orderStatus ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    transaction.orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    transaction.orderStatus === 'available_for_pickup' ? 'bg-yellow-100 text-yellow-800' :
                                    transaction.orderStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {transaction.orderStatus.replace('_', ' ')}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                    Completed
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-600">
                                {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-green-50 border-t-2 border-green-600 font-bold">
                          <tr>
                            <td colSpan="5" className="px-3 py-4 text-right border-r border-gray-300">
                              SERVICE TOTALS:
                            </td>
                            <td className="px-3 py-4 text-right border-r border-gray-300">-</td>
                            <td className="px-3 py-4 text-center border-r border-gray-300">-</td>
                            <td className="px-3 py-4 text-right text-green-600 border-r border-gray-300">
                              {serviceTotals.totalSubtotal ? formatCurrency(serviceTotals.totalSubtotal) : formatCurrency(0)}
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  
                    {/* Service Pagination Controls */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <p className="text-sm text-gray-600">
                        Page {servicePage} of {Math.ceil(serviceTransactions.length / itemsPerPage)} | Total: {serviceTransactions.length} transactions
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setServicePage(Math.max(1, servicePage - 1))}
                          disabled={servicePage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setServicePage(Math.min(Math.ceil(serviceTransactions.length / itemsPerPage), servicePage + 1))}
                          disabled={servicePage === Math.ceil(serviceTransactions.length / itemsPerPage)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-8 py-12 text-center text-gray-500">
                  <p>No service transactions found for the selected period.</p>
                </div>
              )}
            </div>

            {/* Grand Total Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
              <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
                <p className="text-gray-600 text-sm font-medium">Product Revenue</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {productTotals.totalSubtotal ? formatCurrency(productTotals.totalSubtotal) : formatCurrency(0)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
                <p className="text-gray-600 text-sm font-medium">Service Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {serviceTotals.totalSubtotal ? formatCurrency(serviceTotals.totalSubtotal) : formatCurrency(0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {formatCurrency((productTotals.totalSubtotal || 0) + (serviceTotals.totalSubtotal || 0))}
                </p>
              </div>
            </div>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
