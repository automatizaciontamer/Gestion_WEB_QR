"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Empresa } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthContextType {
  isAdmin: boolean;
  isUser: boolean;
  user: any | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  empresa: Empresa | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const router = useRouter();
  const db = useFirestore();

  // Cargar datos de empresa al inicio con captura de errores silenciosa para no bloquear el login
  useEffect(() => {
    if (!db) return;
    const empresaRef = doc(db, 'config', 'empresa');
    getDoc(empresaRef)
      .then((snap) => {
        if (snap.exists()) {
          setEmpresa(snap.data() as Empresa);
        }
      })
      .catch((error) => {
        // Emitimos el error para depuración pero no bloqueamos la app
        const permissionError = new FirestorePermissionError({
          path: empresaRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }, [db]);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setIsUser(false);
    setUser(null);
    sessionStorage.removeItem('tamer_session');
    router.push('/login');
  }, [router]);

  const login = async (identifier: string, password: string) => {
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // 1. Administrador Maestro (Login local, no requiere Firestore)
    if (normalizedIdentifier === 'admin' && password === '14569') {
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
      return true;
    }

    // 2. Email de Contacto de Empresa (Acceso Global)
    if (empresa && normalizedIdentifier === empresa.emailContacto.toLowerCase() && password === empresa.claveContacto) {
      const empresaUserData = {
        email: empresa.emailContacto,
        role: 'empresa',
        nombre: empresa.razonSocial,
        id: 'empresa-global'
      };
      setIsAdmin(false);
      setIsUser(true);
      setUser(empresaUserData);
      sessionStorage.setItem('tamer_session', JSON.stringify(empresaUserData));
      return true;
    }

    // 3. Usuarios Habilitados y Accesos de Obra
    if (!db) return false;
    
    try {
      // Intento en usuarios_clientes
      const q = query(
        collection(db, 'usuarios_clientes'),
        where('email', '==', normalizedIdentifier),
        where('password', '==', password)
      );
      
      const querySnapshot = await getDocs(q).catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: 'usuarios_clientes',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw err;
      });
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const userData = { ...docSnap.data(), id: docSnap.id, role: 'user' };
        setIsAdmin(false);
        setIsUser(true);
        setUser(userData);
        sessionStorage.setItem('tamer_session', JSON.stringify(userData));
        return true;
      }

      // Intento en accesos de obra
      const qObra = query(
        collection(db, 'obras'),
        where('usuarioAcceso', '==', normalizedIdentifier),
        where('claveAcceso', '==', password)
      );
      
      const obraSnapshot = await getDocs(qObra).catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: 'obras',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw err;
      });

      if (!obraSnapshot.empty) {
        const docSnap = obraSnapshot.docs[0];
        const userData = { ...docSnap.data(), id: docSnap.id, role: 'field' };
        setIsAdmin(false);
        setIsUser(true);
        setUser(userData);
        sessionStorage.setItem('tamer_session', JSON.stringify(userData));
        return true;
      }

    } catch (error) {
      // Los errores ya se emiten arriba
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

  return (
    <AuthContext.Provider value={{ isAdmin, isUser, user, login, logout, loading, empresa }}>
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
