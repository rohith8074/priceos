'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Dummy credentials
const VALID_USERS = [
  { username: 'demo', password: 'demo123', role: 'user' as const },
  { username: 'admin', password: 'admin123', role: 'admin' as const },
];

interface User {
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('priceos_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('priceos_user');
      }
    }
    setMounted(true);
  }, []);

  const login = (username: string, password: string): boolean => {
    const validUser = VALID_USERS.find(
      u => u.username === username && u.password === password
    );

    if (validUser) {
      const user = { username: validUser.username, role: validUser.role };
      setUser(user);
      localStorage.setItem('priceos_user', JSON.stringify(user));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('priceos_user');
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
