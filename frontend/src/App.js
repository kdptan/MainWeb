import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingActionButtons from './components/FloatingActionButtons';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ManagementPage from './pages/ManagementPage';
import Inventory from './pages/management/Inventory';
import Products from './pages/management/Products';
import Services from './pages/management/Services';
import PetProfile from './pages/management/PetProfile';
import ActivityLog from './pages/management/ActivityLog';
import StaffManagement from './pages/management/StaffManagement';
import ProductsPage from './pages/ProductsPage';
import ServicesPage from './pages/ServicesPage';
import AppointmentPage from './pages/AppointmentPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import AdminAppointmentsPage from './pages/AdminAppointmentsPage';
import AdminServicesPage from './pages/AdminServicesPage';
import CartPage from './pages/CartPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
import FeedbackPage from './pages/FeedbackPage';
import EndOfDayReportsPage from './pages/EndOfDayReportsPage';
import SalesPage from './pages/SalesPage';
import SalesReportPage from './pages/SalesReportPage';

function AppContent() {
  const { user, token } = useAuth();
  const location = useLocation();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [myOrdersCount, setMyOrdersCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);

  // Pages that should show floating buttons
  const showFloatingButtons = 
    location.pathname === '/products' ||
    location.pathname === '/feedback' ||
    location.pathname === '/my-orders' ||
    location.pathname === '/admin/orders';

  // Hide footer on all management pages
  const hideFooter = location.pathname.startsWith('/management');

  // Fetch pending orders count for admin
  useEffect(() => {
    if (user && user.is_staff && showFloatingButtons) {
      const fetchPendingOrdersCount = async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/orders/admin/all/?status=pending', {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const data = await res.json();
            const pendingOrders = Array.isArray(data) 
              ? data.filter(order => order.status === 'pending') 
              : [];
            setPendingOrdersCount(pendingOrders.length);
          }
        } catch (err) {
          console.error('Error fetching pending orders count:', err);
        }
      };
      fetchPendingOrdersCount();
      const interval = setInterval(fetchPendingOrdersCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token, showFloatingButtons]);

  // Fetch my orders count
  useEffect(() => {
    if (user && token && showFloatingButtons) {
      const fetchMyOrdersCount = async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/orders/?status=pending', {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const data = await res.json();
            const pendingOrders = Array.isArray(data) 
              ? data.filter(order => order.status === 'pending') 
              : [];
            setMyOrdersCount(pendingOrders.length);
          }
        } catch (err) {
          console.error('Error fetching my orders count:', err);
        }
      };
      fetchMyOrdersCount();
      const interval = setInterval(fetchMyOrdersCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token, showFloatingButtons]);

  // Fetch feedback count
  useEffect(() => {
    if (user && token && showFloatingButtons) {
      const fetchFeedbackCount = async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/orders/?status=completed', {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.filter(order => !order.has_feedback).length : 0;
            setFeedbackCount(count);
          }
        } catch (err) {
          console.error('Error fetching feedback count:', err);
        }
      };
      fetchFeedbackCount();
      const interval = setInterval(fetchFeedbackCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token, showFloatingButtons]);

  return (
    <div className="min-h-screen bg-primary-darker">
      <Navbar />
      <main className="py-12">
        <PageTransition>
          <Routes>
            {/* Public Routes - Accessible without login */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/:role" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            {/* Protected Routes - Requires Authentication */}
            <Route path="/appointment" element={<ProtectedRoute><AppointmentPage /></ProtectedRoute>} />
            <Route path="/my-appointments" element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />

            {/* Admin Routes - Requires Admin Authentication */}
            <Route path="/admin/appointments" element={<ProtectedRoute adminOnly><AdminAppointmentsPage /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute adminOnly><AdminServicesPage /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrdersPage /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute adminOnly><AdminFeedbackPage /></ProtectedRoute>} />
            <Route path="/admin/end-of-day-reports" element={<ProtectedRoute adminOnly><EndOfDayReportsPage /></ProtectedRoute>} />
            <Route path="/admin/sales" element={<ProtectedRoute adminOnly><SalesPage /></ProtectedRoute>} />
            <Route path="/admin/sales-report" element={<ProtectedRoute adminOnly><SalesReportPage /></ProtectedRoute>} />
            <Route path="/management" element={<ProtectedRoute adminOnly><ManagementPage /></ProtectedRoute>} />
            <Route path="/management/inventory" element={<ProtectedRoute adminOnly><Inventory /></ProtectedRoute>} />
            <Route path="/management/products" element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>} />
            <Route path="/management/services" element={<ProtectedRoute adminOnly><Services /></ProtectedRoute>} />
            <Route path="/management/petprofile" element={<ProtectedRoute adminOnly><PetProfile /></ProtectedRoute>} />
            <Route path="/management/activity-log" element={<ProtectedRoute adminOnly><ActivityLog /></ProtectedRoute>} />
            <Route path="/management/staff-management" element={<ProtectedRoute adminOnly><StaffManagement /></ProtectedRoute>} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </PageTransition>
      </main>
      
      {/* Floating Buttons - Only on specific pages, fixed to viewport */}
      {showFloatingButtons && (
        <FloatingActionButtons 
          user={user}
          cart={[]}
          pendingOrdersCount={pendingOrdersCount}
          myOrdersCount={myOrdersCount}
          feedbackCount={feedbackCount}
          showCart={true}
        />
      )}
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

