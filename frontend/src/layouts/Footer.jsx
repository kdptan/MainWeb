import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/ChonkyLogo.png';

export default function Footer() {
  const location = useLocation();
  const path = location.pathname || '';

  // Hide footer on auth pages (same as navbar)
  if (path === '/signin' || path === '/forgot-password' || path.startsWith('/register') || path.startsWith('/reset-password') || path.startsWith('/verify-email')) return null;

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-chonky-khaki">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="Chonky Boi Logo" className="h-12 w-auto" />
              <div className="flex flex-col items-center leading-tight">
                <span className="font-display font-bold text-xl text-chonky-brown" style={{fontFamily: 'Martel Sans, sans-serif', letterSpacing: '-0.02em'}}>Chonky Boi</span>
              </div>
            </Link>
            <p className="text-body text-chonky-brown text-center md:text-left">
              Your FURiendly neighborhood Pet Store and Grooming Salon!
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-heading font-bold text-lg text-chonky-brown mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/home" onClick={scrollToTop} className="text-body text-chonky-brown hover:text-footer-orange transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" onClick={scrollToTop} className="text-body text-chonky-brown hover:text-footer-orange transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/services" onClick={scrollToTop} className="text-body text-chonky-brown hover:text-footer-orange transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/appointment" onClick={scrollToTop} className="text-body text-chonky-brown hover:text-footer-orange transition-colors">
                  Book Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-heading font-bold text-lg text-chonky-brown mb-4">Contact Us</h3>
            <ul className="space-y-2 text-body text-chonky-brown">
              <li>Email: info@chonkyboi.com</li>
              <li>Phone: (+63) 993 664 8189</li>
              <li>Address: Door 2, Suniga Bldg., Sunshine Village, Matina Aplaya Road</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-chonky-brown">
          <p className="text-body text-chonky-brown text-center">
            © {new Date().getFullYear()} Chonky Boi Pet Store and Grooming Salon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

