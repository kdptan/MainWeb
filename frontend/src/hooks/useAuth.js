import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem('access') || sessionStorage.getItem('access') || null;
  });

  useEffect(() => {
    if (token) {
      // fetch profile and validate token
      fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => {
          if (!r.ok) {
            // Token is invalid or expired
            if (r.status === 401) {
              console.log('Token expired or invalid, clearing authentication');
              localStorage.removeItem('access');
              setToken(null);
              setUser(null);
            }
            return null;
          }
          return r.json();
        })
        .then(data => {
          if (data && data.username) {
            setUser(data);
          }
        })
        .catch((error) => {
          // Network error or other issues
          console.error('Failed to fetch profile:', error);
        });
    }
  }, [token]);

  function saveTokens(access, remember = false) {
    if (remember) {
      // Store in localStorage for persistent login
      localStorage.setItem('access', access);
      localStorage.setItem('rememberMe', 'true');
    } else {
      // Store in sessionStorage for session-only login
      sessionStorage.setItem('access', access);
      localStorage.removeItem('rememberMe');
    }
    setToken(access);
  }

  async function login(username, password, remember = false) {
    const res = await fetch('http://127.0.0.1:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const body = await res.json();
    saveTokens(body.access, remember);
    // fetch profile
    const prof = await fetch('http://127.0.0.1:8000/api/profile/', { headers: { Authorization: `Bearer ${body.access}` } });
    if (prof.ok) {
      const data = await prof.json();
      setUser(data);
    }
    return true;
  }

  function logout() {
    localStorage.removeItem('access');
    sessionStorage.removeItem('access');
    localStorage.removeItem('rememberMe');
    
    // Clear all user-specific cart data
    if (user && user.id) {
      localStorage.removeItem(`cart_${user.id}`);
    }
    
    setToken(null);
    setUser(null);
  }

  async function updateProfile(payload) {
    if (!token) throw new Error('Not authenticated');
    const url = 'http://127.0.0.1:8000/api/profile/';
    let options = { method: 'PUT', headers: { Authorization: `Bearer ${token}` } };
    // If payload is FormData (e.g., includes files), send it raw and don't set JSON header
    if (payload instanceof FormData) {
      options.body = payload;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(payload);
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      // Handle 401 - token expired
      if (res.status === 401) {
        console.log('Token expired during update, clearing authentication');
        localStorage.removeItem('access');
        setToken(null);
        setUser(null);
        throw new Error('Session expired. Please login again.');
      }
      const body = await res.json().catch(() => ({}));
      throw body;
    }
    // refresh profile
    const prof = await fetch('http://127.0.0.1:8000/api/profile/', { headers: { Authorization: `Bearer ${token}` } });
    if (prof.ok) {
      setUser(await prof.json());
    } else if (prof.status === 401) {
      // Token expired during profile refresh
      console.log('Token expired, clearing authentication');
      localStorage.removeItem('access');
      setToken(null);
      setUser(null);
    }
    return true;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
