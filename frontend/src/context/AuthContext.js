import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // For now, don't check auth on load since we're not using persistent sessions
    setLoading(false);
  }, []);

  const login = (userProfile) => {
    setUser(userProfile);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Optionally call logout endpoint
    axios.post('http://localhost:8000/api-auth/logout/', {
      withCredentials: true,
    }).catch(err => console.log('Logout error:', err));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
