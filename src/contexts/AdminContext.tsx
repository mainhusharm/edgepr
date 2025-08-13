import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminUser {
  username: string;
  isAuthenticated: boolean;
  loginTime?: Date;
}

interface AdminContextType {
  admin: AdminUser | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const username = localStorage.getItem('admin_username');
    if (token && username) {
      setAdmin({
        username: username,
        isAuthenticated: true,
      });
    }
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_username', credentials.username);
        setAdmin({
          username: credentials.username,
          isAuthenticated: true,
          loginTime: new Date(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
