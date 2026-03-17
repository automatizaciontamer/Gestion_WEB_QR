"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem('tamer_admin_session');
    router.push('/login');
  }, [router]);

  const login = (password: string) => {
    if (password === '14569') {
      setIsAdmin(true);
      sessionStorage.setItem('tamer_admin_session', 'true');
      router.push('/dashboard');
      return true;
    }
    return false;
  };

  useEffect(() => {
    const session = sessionStorage.getItem('tamer_admin_session');
    if (session === 'true') {
      setIsAdmin(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAdmin, logout]);

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
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