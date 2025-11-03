import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaFileAlt } from 'react-icons/fa';
import logo from '../assets/ChonkyLogo.png';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../services/api';
import UpdateProfileModal from '../components/UpdateProfileModal';

export default function Navbar() {
  // Hooks must be called unconditionally
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const managementRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (managementRef.current && !managementRef.current.contains(e.target)) setManagementOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('access') || sessionStorage.getItem('access');
        const response = await fetch(`${API_BASE_URL}/orders/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch notifications:', response.status);
          return;
        }
        
        const orders = await response.json();
        
        // Filter orders that are marked as available for pickup
        const pickupAvailable = orders.filter(order => order.status === 'available_for_pickup');
        setNotifications(pickupAvailable);
        setUnreadCount(pickupAvailable.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Hide navbar on auth pages
  const path = location.pathname || '';
  if (path === '/signin' || path === '/forgot-password' || path.startsWith('/register')) return null;

  return (
    <nav className="bg-accent-cream shadow-lg border-b-4 border-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3">
              <img src={logo} alt="Chonky Boi Logo" className="h-12 w-auto" />
              <div className="flex flex-col items-center leading-tight">
                <span className="font-bold text-lg text-primary-darker">Chonky Boi Pet Store</span>
                <span className="font-bold text-base text-primary-darker">& Grooming Salon</span>
              </div>
            </Link>
          </div>

          {/* Right: Navigation links */}
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex space-x-4">
              <Link 
                to="/home" 
                className={`text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${
                  path === '/home' || path === '/' ? 'border-secondary text-secondary' : 'border-transparent'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/services" 
                className={`text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${
                  path === '/services' ? 'border-secondary text-secondary' : 'border-transparent'
                }`}
              >
                Services
              </Link>
              <Link 
                to="/products" 
                className={`text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${
                  path === '/products' ? 'border-secondary text-secondary' : 'border-transparent'
                }`}
              >
                Products
              </Link>
              <Link 
                to="/appointment" 
                className={`text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${
                  path === '/appointment' || path.startsWith('/admin/appointments') || path.startsWith('/my-appointments') ? 'border-secondary text-secondary' : 'border-transparent'
                }`}
              >
                Appointment
              </Link>
              {/* Management link removed from the main nav; admin users have a Management dropdown next to their avatar */}
            </div>

            {/* Auth area */}
            <div className="flex items-center gap-4">
              {!user && (
                <>
                  <Link to="/register/user" className="text-sm text-primary-darker hover:text-secondary transition-colors">Sign up</Link>
                  <Link to="/signin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-accent-cream bg-secondary hover:bg-secondary-light transition-colors">Sign in</Link>
                </>
              )}

              {user && (
                <>
                  <div className="relative" ref={managementRef}>
                    {((user.role || '').toLowerCase() === 'admin') && (
                      <button onClick={() => setManagementOpen(s => !s)} className="text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium transition-colors">Management</button>
                    )}

                    {managementOpen && (
                      <div className="absolute left-0 top-full mt-1 w-56 bg-accent-peach border border-secondary rounded-md shadow-xl py-2 z-20 dropdown-menu">
                        <div className="px-2 py-1">
                          <a href="/management/inventory" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">Inventory</a>
                          <a href="/management/products" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">Products</a>
                          <a href="/management/services" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">Services</a>
                          <a href="/management/petprofile" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">PetProfile</a>
                          <a href="/management/activity-log" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">Activity Log</a>
                          <a href="/management/staff-management" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">Staff Management</a>
                          <a href="/admin/feedback" className="block px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors rounded">Purchase Feedback</a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(s => !s)} aria-haspopup="true" aria-expanded={menuOpen} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent-peach transition-colors">
                      <span className="relative inline-block">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-secondary" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary text-accent-cream flex items-center justify-center font-medium border-2 border-secondary">{(user.username || 'U')[0].toUpperCase()}</div>
                        )}
                        {/* status indicator (small dot) */}
                        <span className="absolute bottom-0 right-0 block w-2 h-2 rounded-full border-2 border-accent-cream bg-secondary-lighter" aria-hidden="true"></span>
                      </span>
                      <span title={user.username} className="text-sm text-primary-darker max-w-[120px] truncate">{user.username}</span>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-accent-peach border border-secondary rounded-md shadow-xl py-2 z-20">
                        <div className="px-4 py-2 border-b border-secondary">
                          <div className="flex items-center gap-3">
                            {user.profile_picture ? (
                              <img src={user.profile_picture} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-secondary" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-secondary text-accent-cream flex items-center justify-center font-medium border-2 border-secondary">{(user.username || 'U')[0].toUpperCase()}</div>
                            )}
                            <div className="text-left">
                              <div title={user.username} className="text-sm font-medium text-primary-darker max-w-[160px] truncate">{user.username}</div>
                              {user.email && <div title={user.email} className="text-xs text-primary-dark max-w-[160px] truncate">{user.email}</div>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => { setShowProfileModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-primary-darker hover:bg-accent-cream hover:text-secondary transition-colors">Update Profile</button>
                        <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-accent-cream hover:text-red-700 transition-colors">Logout</button>
                      </div>
                    )}
                  </div>

                  {/* Notification Bell - RIGHT SIDE of Profile */}
                  <div className="relative" ref={notificationRef}>
                    <button 
                      onClick={() => setNotificationOpen(s => !s)}
                      className="relative text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      title="Notifications"
                    >
                      <FaBell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-accent-cream transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-accent-peach border border-secondary rounded-md shadow-xl py-2 z-20 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-secondary font-semibold text-primary-darker">
                          Notifications
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-4 text-center text-sm text-primary-dark">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div key={notification.id} className="px-4 py-3 border-b border-secondary hover:bg-accent-cream transition-colors">
                              <div className="text-sm font-medium text-primary-darker">
                                Order #{notification.id} is available for pickup!
                              </div>
                              <div className="text-xs text-primary-dark mt-1">
                                Branch: {notification.branch}
                              </div>
                              <div className="text-xs text-primary-dark">
                                Amount: ₱{Number(notification.total_price).toFixed(2)}
                              </div>
                              <button
                                onClick={() => navigate('/my-orders')}
                                className="mt-2 text-xs bg-secondary text-accent-cream px-3 py-1 rounded hover:bg-secondary-light transition-colors"
                              >
                                View Orders
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* End of Day Reports Button - Admin Only */}
                  {((user.role || '').toLowerCase() === 'admin' || user.is_staff) && (
                    <button
                      onClick={() => navigate('/admin/end-of-day-reports')}
                      className="relative text-primary-darker hover:text-secondary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      title="End of Day Reports"
                    >
                      <FaFileAlt size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showProfileModal && <UpdateProfileModal onClose={() => setShowProfileModal(false)} />}
    </nav>
  );
}
