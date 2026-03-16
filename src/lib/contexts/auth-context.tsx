
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
    const syncUser = () => {
      if (!isUserLoading) {
        if (firebaseUser) {
          // Strict admin check: Only the authorized email or a valid admin session flag
          // combined with the specific admin email is considered an administrator.
          const isEmailAdmin = firebaseUser.email === 'xyz@admin.com';
          const isAdminSession = typeof window !== 'undefined' && localStorage.getItem('bhartiya_swad_admin') === 'true';
          const isAdmin = isEmailAdmin || (isAdminSession && firebaseUser.email === 'xyz@admin.com');

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

    syncUser();
    
    // Watch for localStorage changes across tabs
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
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
