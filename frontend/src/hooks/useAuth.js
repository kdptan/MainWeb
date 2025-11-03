import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem('access') || sessionStorage.getItem('access') || null;
  });
  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem('refresh') || sessionStorage.getItem('refresh') || null;
  });

  const refreshTimeoutRef = useRef(null);

  // Function to attempt token refresh
  const refreshAccessToken = async (currentRefreshToken) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: currentRefreshToken }),
      });

      if (!res.ok) {
        console.log('Token refresh failed, clearing authentication');
        clearAuth();
        return null;
      }

      const body = await res.json();
      const newAccessToken = body.access;
      const newRefreshToken = body.refresh || currentRefreshToken;

      // Determine if token was stored in localStorage or sessionStorage
      const isRemembered = localStorage.getItem('rememberMe') === 'true';

      if (isRemembered) {
        localStorage.setItem('access', newAccessToken);
        localStorage.setItem('refresh', newRefreshToken);
      } else {
        sessionStorage.setItem('access', newAccessToken);
        sessionStorage.setItem('refresh', newRefreshToken);
      }

      setToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      // Schedule next refresh
      scheduleTokenRefresh(newRefreshToken);

      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearAuth();
      return null;
    }
  };

  // Schedule token refresh before expiration (59 minutes from now)
  const scheduleTokenRefresh = (refreshTok) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh in 55 minutes (access token is 60 minutes)
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('Auto-refreshing token...');
      refreshAccessToken(refreshTok);
    }, 55 * 60 * 1000);
  };

  const clearAuth = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('refresh');
    localStorage.removeItem('rememberMe');

    if (user && user.id) {
      localStorage.removeItem(`cart_${user.id}`);
    }

    setToken(null);
    setRefreshToken(null);
    setUser(null);

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (token) {
      // fetch profile and validate token
      fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => {
          if (!r.ok) {
            // Token is invalid or expired
            if (r.status === 401 && refreshToken) {
              console.log('Token expired, attempting refresh...');
              return refreshAccessToken(refreshToken);
            } else if (r.status === 401) {
              console.log('Token expired and no refresh token available');
              clearAuth();
            }
            return null;
          }
          return r.json();
        })
        .then(data => {
          if (data && typeof data === 'object' && data.username) {
            setUser(data);
            // Schedule token refresh if we have a refresh token
            if (refreshToken) {
              scheduleTokenRefresh(refreshToken);
            }
          }
        })
        .catch((error) => {
          // Network error or other issues
          console.error('Failed to fetch profile:', error);
        });
    }

    return () => {
      // Cleanup timeout on unmount
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshToken]);

  function saveTokens(access, refresh, remember = false) {
    if (remember) {
      // Store in localStorage for persistent login
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      localStorage.setItem('rememberMe', 'true');
    } else {
      // Store in sessionStorage for session-only login
      sessionStorage.setItem('access', access);
      sessionStorage.setItem('refresh', refresh);
      localStorage.removeItem('rememberMe');
    }
    setToken(access);
    setRefreshToken(refresh);

    // Schedule token refresh
    scheduleTokenRefresh(refresh);
  }

  async function login(username, password, remember = false) {
    const res = await fetch('http://127.0.0.1:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const body = await res.json();
    saveTokens(body.access, body.refresh, remember);
    // fetch profile
    const prof = await fetch('http://127.0.0.1:8000/api/profile/', { headers: { Authorization: `Bearer ${body.access}` } });
    if (prof.ok) {
      const data = await prof.json();
      setUser(data);
    }
    return true;
  }

  function logout() {
    clearAuth();
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
        console.log('Token expired during update, attempting refresh...');
        if (refreshToken) {
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            // Retry with new token
            options.headers.Authorization = `Bearer ${newToken}`;
            const retryRes = await fetch(url, options);
            if (!retryRes.ok) throw new Error('Update failed after token refresh');
            await retryRes.json();
            // Refresh profile
            const prof = await fetch('http://127.0.0.1:8000/api/profile/', { headers: { Authorization: `Bearer ${newToken}` } });
            if (prof.ok) {
              setUser(await prof.json());
            }
            return true;
          }
        }
        clearAuth();
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
      console.log('Token expired, attempting refresh...');
      if (refreshToken) {
        await refreshAccessToken(refreshToken);
      } else {
        clearAuth();
      }
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
