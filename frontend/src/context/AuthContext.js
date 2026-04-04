import React, { createContext, useState, useEffect } from 'react';
import axios from '../services/axiosConfig';  // IMPORT the configured instance, NOT the module

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // LOGIN FUNCTION - ACTUALLY CALLS THE API
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/login/', {
        username,
        password
      });
      
      console.log('Login API response:', response.data);
      
      if (response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store user data for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true };
      } else {
        return { success: false, error: 'No user data received' };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Distinguish between different error types
      let errorMessage = 'Login failed. Please try again.';
      let errorType = 'unknown';
      
      if (error.response) {
        // Server responded with an error
        if (error.response.status === 401 || error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid username or password';
          errorType = 'auth';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
          errorType = 'server';
        } else {
          errorMessage = error.response.data?.error || 'Login failed. Please try again.';
          errorType = 'server';
        }
      } else if (error.request) {
        // Request made but no response received (server is down)
        errorMessage = 'Unable to connect to server. Please check if the server is running.';
        errorType = 'network';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errorType: errorType
      };
    }
  };

  // LOGOUT FUNCTION - CLEARS SESSION
  const logout = async () => {
    try {
      // Note: Django's session-based auth doesn't require a logout endpoint
      // The session will expire naturally, we just clear client state
      console.log('Logging out - clearing local state');
    } catch (error) {
      console.log('Logout error (expected for session auth):', error);
    } finally {
      // Clear local state regardless of API response
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};