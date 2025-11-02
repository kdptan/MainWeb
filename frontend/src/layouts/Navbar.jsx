import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/ChonkyLogo.png';
import { useAuth } from '../hooks/useAuth';
import UpdateProfileModal from '../components/UpdateProfileModal';

export default function Navbar() {
  // Hooks must be called unconditionally
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef(null);
  const managementRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (managementRef.current && !managementRef.current.contains(e.target)) setManagementOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

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
              <span className="font-bold text-lg text-primary-darker">Chonky Boi Pet Store and Grooming Salon</span>
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
                      <div className="absolute right-0 mt-2 w-56 bg-accent-peach border border-secondary rounded-md shadow-xl py-2 z-20">
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
