
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import PageTransition from './components/PageTransition';
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

function App() {
  return (
    <div className="min-h-screen bg-primary-darker">
      <BrowserRouter>
        <Navbar />
        <main className="py-12">
          <PageTransition>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/appointment" element={<AppointmentPage />} />
              <Route path="/my-appointments" element={<MyAppointmentsPage />} />
              <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
              <Route path="/signin" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/:role" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/management/inventory" element={<Inventory />} />
              <Route path="/management/products" element={<Products />} />
              <Route path="/management/services" element={<Services />} />
              <Route path="/management/petprofile" element={<PetProfile />} />
              <Route path="/management/activity-log" element={<ActivityLog />} />
              <Route path="/management/staff-management" element={<StaffManagement />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </PageTransition>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;

