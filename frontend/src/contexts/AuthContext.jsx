import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Fetch real user data from Backend API using token
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Call ASP.NET Core Login API
      const response = await api.post('/auth/login', { email, password });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // Fetch user profile immediately after login
      const meResponse = await api.get('/auth/me');
      
      setUser(meResponse.data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
