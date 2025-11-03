import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaShoppingBag, FaDollarSign, FaChartLine, FaStore, FaPrint } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';

export default function EndOfDayReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    availableForPickup: 0,
    totalRevenue: 0,
    revenueByBranch: {},
    topProducts: [],
    topServices: [],
  });

  useEffect(() => {
    // Wait for auth to settle before checking
    const hasToken = localStorage.getItem('access');
    if (!user && hasToken) {
      return;
    }

    // Redirect non-admin users
    if (!user || !user.is_staff) {
      toast.showToast('Admin access required', 'error');
      navigate('/products');
      return;
    }

    fetchReportData();
  }, [user, selectedDate, selectedBranch]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAllOrdersAdmin({});
      
      // Filter orders by selected date
      const filteredOrders = data.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        const matchesDate = orderDate === selectedDate;
        const matchesBranch = selectedBranch === 'all' || order.branch === selectedBranch;
        return matchesDate && matchesBranch;
      });

      setOrders(filteredOrders);

      // Calculate report metrics
      const completed = filteredOrders.filter(o => o.status === 'completed');
      const cancelled = filteredOrders.filter(o => o.status === 'cancelled');
      const pending = filteredOrders.filter(o => o.status === 'pending');
      const availableForPickup = filteredOrders.filter(o => o.status === 'available_for_pickup');

      const totalRevenue = completed.reduce((sum, order) => sum + parseFloat(order.total_price), 0);

      // Revenue by branch
      const revenueByBranch = {};
      completed.forEach(order => {
        if (!revenueByBranch[order.branch]) {
          revenueByBranch[order.branch] = 0;
        }
        revenueByBranch[order.branch] += parseFloat(order.total_price);
      });

      // Count products and services
      const productCount = {};
      const serviceCount = {};
      
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.item_type === 'product' && item.product) {
            const key = item.product.name;
            productCount[key] = (productCount[key] || 0) + item.quantity;
          } else if (item.item_type === 'service' && item.service) {
            const key = item.service.name;
            serviceCount[key] = (serviceCount[key] || 0) + item.quantity;
          }
        });
      });

      // Top 5 products and services
      const topProducts = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      const topServices = Object.entries(serviceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setReportData({
        totalOrders: filteredOrders.length,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
        pendingOrders: pending.length,
        availableForPickup: availableForPickup.length,
        totalRevenue,
        revenueByBranch,
        topProducts,
        topServices,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
              <h1 className="text-3xl font-bold text-primary-darker">End of Day Report</h1>
              <p className="text-sm text-gray-600 mt-1">Daily Sales and Operations Summary</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-accent-cream rounded-lg hover:bg-secondary-light font-medium text-sm transition-colors print:hidden"
            >
              <FaPrint /> Print Report
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center print:hidden">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-secondary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <FaStore className="text-secondary" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="all">All Branches</option>
                <option value="Matina">Matina</option>
                <option value="Toril">Toril</option>
              </select>
            </div>
          </div>

          {/* Report Date/Branch Display for Print */}
          <div className="hidden print:block mt-4 text-sm text-gray-600">
            <p><strong>Report Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Branch:</strong> {selectedBranch === 'all' ? 'All Branches' : selectedBranch}</p>
            <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            <p className="mt-4 text-accent-cream">Loading report data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-primary-darker mt-2">{reportData.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FaShoppingBag className="text-blue-600 text-2xl" />
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">₱{reportData.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <FaDollarSign className="text-green-600 text-2xl" />
                  </div>
                </div>
              </div>

              {/* Completed Orders */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{reportData.completedOrders}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <FaChartLine className="text-green-600 text-2xl" />
                  </div>
                </div>
              </div>

              {/* Pending/Available */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending/Available</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {reportData.pendingOrders + reportData.availableForPickup}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <FaShoppingBag className="text-yellow-600 text-2xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue by Branch */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary-darker mb-4">Revenue by Branch</h2>
                {Object.keys(reportData.revenueByBranch).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No completed orders</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(reportData.revenueByBranch).map(([branch, revenue]) => (
                      <div key={branch} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{branch}</span>
                        <span className="text-lg font-bold text-secondary">₱{revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary-darker mb-4">Order Status Breakdown</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-700">Completed</span>
                    <span className="text-lg font-bold text-green-600">{reportData.completedOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">Available for Pickup</span>
                    <span className="text-lg font-bold text-blue-600">{reportData.availableForPickup}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-gray-700">Pending</span>
                    <span className="text-lg font-bold text-yellow-600">{reportData.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-700">Cancelled</span>
                    <span className="text-lg font-bold text-red-600">{reportData.cancelledOrders}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products and Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary-darker mb-4">Top Products</h2>
                {reportData.topProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No products sold</p>
                ) : (
                  <div className="space-y-3">
                    {reportData.topProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{product.name}</span>
                        <span className="text-lg font-bold text-secondary">{product.count} sold</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Services */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary-darker mb-4">Top Services</h2>
                {reportData.topServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No services booked</p>
                ) : (
                  <div className="space-y-3">
                    {reportData.topServices.map((service, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{service.name}</span>
                        <span className="text-lg font-bold text-secondary">{service.count} booked</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .min-h-screen {
            background: white !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
