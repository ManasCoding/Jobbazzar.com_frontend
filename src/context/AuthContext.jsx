import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Set global axios defaults
axios.defaults.withCredentials = true;

// Setup axios request interceptor to attach token if present in localStorage
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const savedUser = localStorage.getItem('jb_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('jb_token');
      try {
        const res = await axios.get('http://localhost:5000/api/v1/auth/me');
        setUserInfo(res.data.data);
        localStorage.setItem('jb_user', JSON.stringify(res.data.data));
      } catch (error) {
        // Not logged in or invalid token
        if (!token) {
          setUserInfo(null);
          localStorage.removeItem('jb_user');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:5000/api/v1/auth/login', { email, password });
    const user = res.data.data;
    setUserInfo(user);
    if (user.token) {
      localStorage.setItem('jb_token', user.token);
    }
    localStorage.setItem('jb_user', JSON.stringify(user));
    return user;
  };

  const register = async (name, email, password) => {
    const res = await axios.post('http://localhost:5000/api/v1/auth/register', { name, email, password });
    const user = res.data.data;
    setUserInfo(user);
    if (user.token) {
      localStorage.setItem('jb_token', user.token);
    }
    localStorage.setItem('jb_user', JSON.stringify(user));
    return user;
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('jb_token');
      localStorage.removeItem('jb_user');
      setUserInfo(null);
    }
  };

  return (
    <AuthContext.Provider value={{ userInfo, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
