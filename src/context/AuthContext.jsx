import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Set global axios defaults
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/v1/auth/me');
        setUserInfo(res.data.data);
      } catch (error) {
        // Not logged in or invalid token
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:5000/api/v1/auth/login', { email, password });
    setUserInfo(res.data.data);
    return res.data.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post('http://localhost:5000/api/v1/auth/register', { name, email, password });
    setUserInfo(res.data.data);
    return res.data.data;
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
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
