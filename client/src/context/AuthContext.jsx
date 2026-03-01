import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    getCurrentUser()
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  function login(userData, token) {
    localStorage.setItem('token', token);
    setUser(userData);
  }

  function logout() {
    logoutService();
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCoordinator: user?.role === 'coordinator',
    isVolunteer: user?.role === 'volunteer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
