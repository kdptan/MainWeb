
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './layouts/Navbar';
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

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navbar />
        <main className="py-12">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<LandingPage />} />
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
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;

