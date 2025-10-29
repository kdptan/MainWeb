import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useAuth } from '../hooks/useAuth';
import UpdateProfileModal from '../components/UpdateProfileModal';

export default function Navbar() {
  // Hooks must be called unconditionally
  const location = useLocation();
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
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-semibold text-lg text-gray-800">Logo</span>
            </Link>
          </div>

          {/* Right: Navigation links */}
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex space-x-4">
              <Link to="/home" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link to="/services" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Services</Link>
              <Link to="/products" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Products</Link>
              <Link to="/appointment" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Appointment</Link>
              {/* Management link removed from the main nav; admin users have a Management dropdown next to their avatar */}
            </div>

            {/* Auth area */}
            <div className="flex items-center gap-4">
              {!user && (
                <>
                  <Link to="/register/user" className="text-sm text-gray-700 hover:text-indigo-600">Sign up</Link>
                  <Link to="/signin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Sign in</Link>
                </>
              )}

              {user && (
                <>
                  <div className="relative" ref={managementRef}>
                    {((user.role || '').toLowerCase() === 'admin') && (
                      <button onClick={() => setManagementOpen(s => !s)} className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Management</button>
                    )}

                    {managementOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg py-2 z-20">
                        <div className="px-2 py-1">
                          <a href="/management/inventory" className="block px-4 py-2 text-sm hover:bg-gray-100">Inventory</a>
                          <a href="/management/products" className="block px-4 py-2 text-sm hover:bg-gray-100">Products</a>
                          <a href="/management/services" className="block px-4 py-2 text-sm hover:bg-gray-100">Services</a>
                          <a href="/management/petprofile" className="block px-4 py-2 text-sm hover:bg-gray-100">PetProfile</a>
                          <a href="/management/activity-log" className="block px-4 py-2 text-sm hover:bg-gray-100">Activity Log</a>
                          <a href="/management/staff-management" className="block px-4 py-2 text-sm hover:bg-gray-100">Staff Management</a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(s => !s)} aria-haspopup="true" aria-expanded={menuOpen} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100">
                      <span className="relative inline-block">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">{(user.username || 'U')[0].toUpperCase()}</div>
                        )}
                        {/* status indicator (small dot) */}
                        <span className="absolute bottom-0 right-0 block w-2 h-2 rounded-full border-2 border-white bg-emerald-400" aria-hidden="true"></span>
                      </span>
                      <span title={user.username} className="text-sm text-gray-700 max-w-[120px] truncate">{user.username}</span>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg py-2 z-20">
                        <div className="px-4 py-2 border-b">
                          <div className="flex items-center gap-3">
                            {user.profile_picture ? (
                              <img src={user.profile_picture} alt="avatar" className="w-10 h-10 rounded-full object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">{(user.username || 'U')[0].toUpperCase()}</div>
                            )}
                            <div className="text-left">
                              <div title={user.username} className="text-sm font-medium text-gray-800 max-w-[160px] truncate">{user.username}</div>
                              {user.email && <div title={user.email} className="text-xs text-gray-500 max-w-[160px] truncate">{user.email}</div>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => { setShowProfileModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Update Profile</button>
                        <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</button>
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
