
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useFirebaseAuth } from '@/firebase';
import { User as FirebaseUser } from 'firebase/auth';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useFirebaseAuth();

  useEffect(() => {
    const checkAdmin = () => {
      if (!isUserLoading) {
        if (firebaseUser) {
          // Check for hardcoded admin email or a persistent session flag
          const isAdminSession = typeof window !== 'undefined' && localStorage.getItem('bhartiya_swad_admin') === 'true';
          const isEmailAdmin = firebaseUser.email === 'xyz@admin.com';
          const isAdmin = isEmailAdmin || isAdminSession;

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Guest',
            role: isAdmin ? 'admin' : 'user',
            isAdmin: isAdmin
          });
        } else {
          setUser(null);
        }
      }
    };

    checkAdmin();
    
    // Listen for storage changes in case login happens in another tab
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, [firebaseUser, isUserLoading]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bhartiya_swad_admin');
    }
    auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading: isUserLoading, logout }}>
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
