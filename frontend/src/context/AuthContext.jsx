import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ecotrace_token') || null);
  const [loading, setLoading] = useState(true);

  // Thiết lập mặc định header Axios Authorization
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const savedUser = localStorage.getItem('ecotrace_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:8000/api/users/login/', { email, password });
    const { access, user } = res.data;
    localStorage.setItem('ecotrace_token', access);
    localStorage.setItem('ecotrace_user', JSON.stringify(user));
    setToken(access);
    setUser(user);
    return user;
  };

  const register = async (payload) => {
    const res = await axios.post('http://localhost:8000/api/users/register/', payload);
    const { access, user } = res.data;
    localStorage.setItem('ecotrace_token', access);
    localStorage.setItem('ecotrace_user', JSON.stringify(user));
    setToken(access);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('ecotrace_token');
    localStorage.removeItem('ecotrace_user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}