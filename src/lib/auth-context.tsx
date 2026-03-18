
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  isAdmin: boolean;
  isUser: boolean;
  user: any | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const db = useFirestore();

  const logout = useCallback(() => {
    setIsAdmin(false);
    setIsUser(false);
    setUser(null);
    sessionStorage.removeItem('tamer_session');
    router.push('/login');
  }, [router]);

  const login = async (identifier: string, password: string) => {
    // Administrador Maestro: Usuario "admin", Clave "14569"
    if (identifier === 'admin' && password === '14569') {
      const adminData = { 
        email: 'admin@tamer.com', 
        role: 'admin', 
        nombre: 'Administrador Maestro',
        id: 'admin-master'
      };
      setIsAdmin(true);
      setIsUser(true);
      setUser(adminData);
      sessionStorage.setItem('tamer_session', JSON.stringify(adminData));
      router.push('/dashboard');
      return true;
    }

    // Usuario Habilitado (Consulta en Firestore compartida con Android)
    if (!db) return false;
    
    try {
      const q = query(
        collection(db, 'usuarios_clientes'),
        where('email', '==', identifier),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const userData = { ...doc.data(), id: doc.id, role: 'user' };
        setIsAdmin(false);
        setIsUser(true);
        setUser(userData);
        sessionStorage.setItem('tamer_session', JSON.stringify(userData));
        router.push('/dashboard');
        return true;
      }
    } catch (error) {
      console.error("Error en login:", error);
    }

    return false;
  };

  useEffect(() => {
    const session = sessionStorage.getItem('tamer_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        setUser(data);
        setIsUser(true);
        setIsAdmin(data.role === 'admin');
      } catch (e) {
        sessionStorage.removeItem('tamer_session');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isUser) return;

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
  }, [isUser, logout]);

  return (
    <AuthContext.Provider value={{ isAdmin, isUser, user, login, logout, loading }}>
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
