
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
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
  const auth = useFirebaseAuth();

  // Cargar datos de empresa al inicio de forma silenciosa
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
        // No emitimos error aquí porque es normal que falle antes del login
        console.warn('Configuración de empresa no accesible aún.');
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
    if (!db || !auth) return false;
    
    const normalizedIdentifier = identifier.toLowerCase().trim();

    try {
      // Autenticamos anónimamente en Firebase para obtener permisos de Firestore
      await signInAnonymously(auth);

      // 1. Administrador Maestro (Local)
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
      // Intentamos obtener el doc de empresa ahora que tenemos sesión anónima
      const empresaRef = doc(db, 'config', 'empresa');
      const empresaSnap = await getDoc(empresaRef).catch(() => null);
      
      if (empresaSnap && empresaSnap.exists()) {
        const empData = empresaSnap.data() as Empresa;
        if (normalizedIdentifier === empData.emailContacto.toLowerCase() && password === empData.claveContacto) {
          const empresaUserData = {
            email: empData.emailContacto,
            role: 'empresa',
            nombre: empData.razonSocial,
            id: 'empresa-global'
          };
          setIsAdmin(false);
          setIsUser(true);
          setUser(empresaUserData);
          sessionStorage.setItem('tamer_session', JSON.stringify(empresaUserData));
          return true;
        }
      }

      // 3. Usuarios Habilitados
      const q = query(
        collection(db, 'usuarios_clientes'),
        where('email', '==', normalizedIdentifier),
        where('password', '==', password)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const userData = { ...docSnap.data(), id: docSnap.id, role: 'user' };
        setIsAdmin(false);
        setIsUser(true);
        setUser(userData);
        sessionStorage.setItem('tamer_session', JSON.stringify(userData));
        return true;
      }

      // 4. Accesos de Obra
      const qObra = query(
        collection(db, 'obras'),
        where('usuarioAcceso', '==', normalizedIdentifier),
        where('claveAcceso', '==', password)
      );
      
      const obraSnapshot = await getDocs(qObra);

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
      console.error('Error durante el proceso de login:', error);
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
        // Re-autenticar anónimamente si hay sesión guardada
        if (auth) signInAnonymously(auth).catch(() => null);
      } catch (e) {
        sessionStorage.removeItem('tamer_session');
      }
    }
    setLoading(false);
  }, [auth]);

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
