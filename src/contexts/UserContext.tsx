import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../api';

export interface User {
  id: string;
  name: string;
  email: string;
  membershipTier: 'basic' | 'pro' | 'professional' | 'institutional' | 'elite' | 'enterprise' | 'kickstarter';
  accountType: 'personal' | 'funded' | 'prop';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  isAuthenticated: boolean;
  setupComplete: boolean;
  journalLink?: string;
  token?: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  login: (userData: Omit<User, 'isAuthenticated' | 'membershipTier'>, token: string, rememberMe?: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      const decodedToken = JSON.parse(atob(storedToken.split('.')[1]));
      const plan = decodedToken.plan_type || 'basic';
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      return { ...parsedUser, membershipTier: plan, isAuthenticated: true, token: storedToken };
    }
    return null;
  });

  useEffect(() => {
    const handleSessionInvalid = () => {
      logout();
      // Optionally, redirect to login or show a message
      alert('Your session has expired. Please log in again.');
    };

    window.addEventListener('session-invalid', handleSessionInvalid);

    return () => {
      window.removeEventListener('session-invalid', handleSessionInvalid);
    };
  }, []);

  const login = (userData: Omit<User, 'isAuthenticated' | 'membershipTier'>, token: string, rememberMe = false) => {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const plan = decodedToken.plan_type || 'basic';
    const name = decodedToken.username || userData.email;

    const updatedUserData = {
      ...userData,
      name,
      membershipTier: plan,
    };

    const finalUserData = { ...updatedUserData, membershipTier: plan, isAuthenticated: true, token };

    // Always use localStorage to persist data
    localStorage.setItem('user', JSON.stringify(finalUserData));
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(finalUserData);
  };

  const logout = () => {
    // Don't remove user data, just remove authentication
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, login }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
