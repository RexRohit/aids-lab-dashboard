import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin as apiLogin, adminLogout as apiLogout, checkAdminAuth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const res = await checkAdminAuth();
        if (res.success && res.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(res.user);
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } catch (err) {
        // Fallback: check localStorage token if API is still warming up
        const localUser = localStorage.getItem('admin_user');
        const token = localStorage.getItem('admin_token');
        if (token && localUser) {
          try {
            setIsAuthenticated(true);
            setAdminUser(JSON.parse(localUser));
          } catch (e) {
            setIsAuthenticated(false);
            setAdminUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (username, password) => {
    const res = await apiLogin({ username, password });
    if (res.success) {
      setIsAuthenticated(true);
      setAdminUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = async () => {
    await apiLogout();
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
