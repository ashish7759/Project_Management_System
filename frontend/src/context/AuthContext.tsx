import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Fetch current user details from backend
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Failed to authenticate session token:", err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    bootstrapAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, role, full_name, status } = res.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userObj: User = {
        user_id: 0, // Mock id initially until details are fetched
        username,
        full_name,
        role,
        status,
        email: '',
        mobile: '',
        employee_id: '',
        created_at: new Date().toISOString()
      };
      setUser(userObj);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (payload: any) => {
    try {
      const res = await api.post('/auth/register', payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn("Backend logout request failed:", err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
