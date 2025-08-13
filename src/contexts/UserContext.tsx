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
  tradingData?: {
    propFirm: string;
    accountType: string;
    accountSize: string;
    riskPerTrade: string;
    riskRewardRatio: string;
    tradesPerDay: string;
    tradingExperience: string;
    tradingSession: string;
    cryptoAssets: string[];
    forexAssets: string[];
    hasAccount: string;
  };
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
    try {
      const storedUser = localStorage.getItem('current_user');
      const storedToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        
        // Set up API authorization
        if (storedToken.startsWith('demo-token')) {
          // Demo token - don't set API auth
        } else {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        
        return { 
          ...parsedUser, 
          isAuthenticated: true, 
          token: storedToken,
          setupComplete: true // Always true if user data exists
        };
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
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
    let plan = 'professional';
    let name = userData.name;
    
    // Only decode JWT if it's not a demo token
    if (!token.startsWith('demo-token')) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        plan = decodedToken.plan_type || 'professional';
        name = decodedToken.username || userData.name || userData.email;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    const updatedUserData = {
      ...userData,
      name,
      membershipTier: plan,
    };

    const finalUserData = { 
      ...updatedUserData, 
      membershipTier: plan as any, 
      isAuthenticated: true, 
      setupComplete: true,
      token 
    };

    // Store user data with email as key for persistence
    localStorage.setItem('current_user', JSON.stringify(finalUserData));
    localStorage.setItem(`user_profile_${userData.email}`, JSON.stringify(finalUserData));
    localStorage.setItem('access_token', token);
    
    // Only set API auth for real tokens
    if (!token.startsWith('demo-token')) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setUser(finalUserData);
  };

  const logout = () => {
    // Remove authentication but keep user data for persistence
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
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
