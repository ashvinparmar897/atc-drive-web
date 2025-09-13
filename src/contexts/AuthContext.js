import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await api.get('/api/users/me');
        setUser(response.data);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Token expired or invalid
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      setError('');
      const response = await api.post('/api/users/login', {
        username: usernameOrEmail,
        password
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user details
      const userResponse = await api.get('/api/users/me');
      setUser(userResponse.data);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    try {
      setError('');
      const response = await api.post('/api/users/register', {
        username,
        email,
        password
      });
      
      return { success: true, user: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError('');
  };

  const forgotPassword = async (email) => {
    try {
      setError('');
      const response = await api.post('/api/users/forgot-password', { email });
      return { success: true, message: response.data.msg };
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || 'Failed to send reset email.';
      setError(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    try {
      setError('');
      const response = await api.post('/api/users/reset-password', {
        email,
        reset_token: resetToken,
        new_password: newPassword
      });
      return { success: true, message: response.data.msg };
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || 'Failed to reset password.';
      setError(errorMessage);
      throw err;
    }
  };

  const updateUser = async (userData) => {
    try {
      setError('');
      const response = await api.put(`/api/users/me`, userData);
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || 'Failed to update user.';
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    canEdit: user?.role === 'admin' || user?.role === 'editor',
    canView: user?.role === 'admin' || user?.role === 'editor' || user?.role === 'viewer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 