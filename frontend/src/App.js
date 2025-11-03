
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
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
import CartPage from './pages/CartPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
import FeedbackPage from './pages/FeedbackPage';
import EndOfDayReportsPage from './pages/EndOfDayReportsPage';

function App() {
  return (
    <div className="min-h-screen bg-primary-darker">
      <BrowserRouter>
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

              {/* Protected Routes - Requires Authentication */}
              <Route path="/appointment" element={<ProtectedRoute><AppointmentPage /></ProtectedRoute>} />
              <Route path="/my-appointments" element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />

              {/* Admin Routes - Requires Admin Authentication */}
              <Route path="/admin/appointments" element={<ProtectedRoute adminOnly><AdminAppointmentsPage /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrdersPage /></ProtectedRoute>} />
              <Route path="/admin/feedback" element={<ProtectedRoute adminOnly><AdminFeedbackPage /></ProtectedRoute>} />
              <Route path="/admin/end-of-day-reports" element={<ProtectedRoute adminOnly><EndOfDayReportsPage /></ProtectedRoute>} />
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
      </BrowserRouter>
    </div>
  );
}

export default App;

