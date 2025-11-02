import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/ChonkyLogo.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // POST to backend registration endpoint. Update the URL if your API differs.
  const body = { username: form.username, email: form.email, password: form.password, role };

      const res = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Try to parse JSON error body for helpful messages
        let body = null;
        try {
          body = await res.json();
        } catch (err) {
          setError('Registration failed.');
          setLoading(false);
          return;
        }

        // Prefer detailed errors if provided
        if (body && body.errors) {
          // body.errors may be a dict of field errors — convert to a readable string
          const messages = [];
          for (const [k, v] of Object.entries(body.errors)) {
            messages.push(`${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
          }
          setError(messages.join(' | '));
        } else if (body && body.detail) {
          setError(body.detail);
        } else {
          setError('Registration failed.');
        }

        setLoading(false);
        return;
      }

      // On success, backend may have sent a confirmation email. Redirect to signin or show success.
      navigate('/signin');
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // route param can be 'user' or 'admin'; default to 'user'
    const r = (params.role || 'user').toLowerCase();
    setRole(r === 'admin' ? 'admin' : 'user');
  }, [params.role]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 bg-primary-darker">
      <div className="w-full max-w-md bg-accent-cream shadow-2xl rounded-xl p-8 text-center border-4 border-secondary">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Chonky Boi Logo" className="h-24 w-auto" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-primary-darker mb-2">Create account</h2>
        <p className="text-sm text-primary-dark mb-6">Create an account to start shopping for your pets.</p>
        {role === 'admin' && (
          <div className="mb-4 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg p-3">
            Note: Registering on this URL will create an admin account.
          </div>
        )}

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
            <label htmlFor="email" className="block text-sm font-medium text-primary-darker">Email</label>
            <input 
              id="email" 
              name="email" 
              value={form.email} 
              onChange={onChange} 
              type="email" 
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
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-darker">Confirm password</label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              value={form.confirmPassword} 
              onChange={onChange} 
              type="password" 
              required 
              className="mt-1 block w-full rounded-lg border-2 border-primary px-3 py-2 shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary text-primary-darker bg-white" 
            />
          </div>

          {/* No invite code required for admin registration; role is derived from the URL (/register/admin) */}

          {error && <div className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

          <div>
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-accent-cream bg-secondary hover:bg-secondary-light transition-colors shadow-lg disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-sm text-primary-dark">
          Already have an account? <Link to="/signin" className="text-secondary hover:text-secondary-light font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
