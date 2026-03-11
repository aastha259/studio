
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'user' | 'admin' | null;

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('bhartiya_swad_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string, role: Role) => {
    const newUser: User = {
      uid: Math.random().toString(36).substring(7),
      email,
      displayName: email.split('@')[0],
      role,
      isAdmin: role === 'admin'
    };
    setUser(newUser);
    localStorage.setItem('bhartiya_swad_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bhartiya_swad_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
