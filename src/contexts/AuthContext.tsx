import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/contract';
import { db } from '../services/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Validate email format first
      if (!email.endsWith('@vcpmc.org')) {
        setIsLoading(false);
        return false;
      }

      // Check database for users first
      let dbUsers = db.getAll('users');
      
      // If no users in database, create default users
      if (dbUsers.length === 0) {
        const defaultUsers = [
          {
            id: '1',
            username: 'admin',
            fullName: 'Admin User',
            email: 'admin@vcpmc.org',
            role: 'admin' as const,
            status: 'active' as const,
            lastLogin: new Date().toISOString()
          },
          {
            id: '2',
            username: 'user',
            fullName: 'User Client',
            email: 'user@vcpmc.org',
            role: 'user' as const,
            status: 'active' as const,
            lastLogin: new Date().toISOString()
          }
        ];
        
        // Create default users in database
        for (const defaultUser of defaultUsers) {
          await db.create('users', defaultUser);
        }
        
        // Refresh users list
        dbUsers = db.getAll('users');
      }
      
      // Find user by email
      const foundUser = dbUsers.find(u => u.email === email && u.status === 'active');
      
      if (foundUser) {
        // For demo: accept password '123456' for all users
        if (password === '123456') {
          // Update last login
          const updatedUser = {
            ...foundUser,
            lastLogin: new Date().toISOString()
          };
          
          await db.update('users', foundUser.id, { lastLogin: updatedUser.lastLogin });
          
          const token = 'mock-jwt-token-' + Date.now();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('token', token);
          setUser(updatedUser);
          setIsLoading(false);
          return true;
        }
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};