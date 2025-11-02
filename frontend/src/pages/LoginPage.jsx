import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaArrowLeft } from 'react-icons/fa';
import logo from '../assets/ChonkyLogo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    login(form.username, form.password, form.remember)
      .then(() => {
        // success
        navigate('/home');
      })
      .catch(() => {
        setError('Invalid username or password');
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-primary-darker">
      <div className="w-full max-w-md bg-accent-cream shadow-2xl rounded-xl p-8 text-center border-4 border-secondary">
        {/* Back Button - Top of card */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-sm text-primary-dark hover:text-secondary transition-colors mb-4 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Chonky Boi Logo" className="h-24 w-auto" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-primary-darker mb-2">Sign in</h2>
        <p className="text-sm text-primary-dark mb-6">Welcome back! Please enter your details to continue.</p>

        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-primary-darker">Username</label>
            <input 
              id="username" 
              name="username" 
              value={form.username} 
              onChange={onChange} 
              type="text" 
              required 
              className="mt-1 block w-full rounded-lg border-2 border-primary px-3 py-2 shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary text-primary-darker bg-white" 
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-darker">Password</label>
            <input 
              id="password" 
              name="password" 
              value={form.password} 
              onChange={onChange} 
              type="password" 
              required 
              className="mt-1 block w-full rounded-lg border-2 border-primary px-3 py-2 shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary text-primary-darker bg-white" 
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input 
                type="checkbox" 
                name="remember" 
                checked={form.remember} 
                onChange={onChange} 
                className="h-4 w-4 text-secondary focus:ring-secondary border-primary rounded" 
              />
              <span className="ml-2 text-primary-dark">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-secondary hover:text-secondary-light font-medium">Forgot password?</Link>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-accent-cream bg-secondary hover:bg-secondary-light transition-colors shadow-lg disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        {error && <div className="mt-4 text-sm text-red-600 font-medium">{error}</div>}

        <div className="mt-6 text-sm text-primary-dark">
          Don't have an account? <Link to="/register/user" className="text-secondary hover:text-secondary-light font-semibold ml-1">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
