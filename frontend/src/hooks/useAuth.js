import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('access') || null);

  useEffect(() => {
    if (token) {
      // fetch profile
      fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.username) setUser(data);
        })
        .catch(() => {
          // ignore
        });
    }
  }, [token]);

  function saveTokens(access) {
    localStorage.setItem('access', access);
    setToken(access);
  }

  async function login(username, password) {
    const res = await fetch('http://127.0.0.1:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const body = await res.json();
    saveTokens(body.access);
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
      const body = await res.json().catch(() => ({}));
      throw body;
    }
    // refresh profile
    const prof = await fetch('http://127.0.0.1:8000/api/profile/', { headers: { Authorization: `Bearer ${token}` } });
    if (prof.ok) setUser(await prof.json());
    return true;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
