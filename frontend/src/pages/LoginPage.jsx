import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    login(form.username, form.password)
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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-md p-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Sign in</h2>
        <p className="text-sm text-gray-600 mb-6">Welcome! — please enter your details to continue.</p>

        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input id="username" name="username" value={form.username} onChange={onChange} type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" value={form.password} onChange={onChange} type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <span className="ml-2 text-gray-700">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">{loading ? 'Signing in...' : 'Sign in'}</button>
          </div>
        </form>
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 text-sm text-gray-600">
          Don't have an account? <Link to="/register/user" className="text-indigo-600 hover:underline ml-1">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
