
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query, where, getDocs, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Empresa } from './types';

interface AuthContextType {
  isAdmin: boolean;
  isUser: boolean;
  user: any | null;
  login: (identifier: string, password: string, restrictedToObraId?: string) => Promise<boolean>;
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

  useEffect(() => {
    if (!db || !auth) return;
    
    signInAnonymously(auth).catch(() => null);

    const empresaRef = doc(db, 'Configuracion', 'Empresa');
    
    const unsubscribe = onSnapshot(empresaRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEmpresa({ ...data, id: snap.id } as Empresa);
      }
    }, (error) => {
      console.warn('Conectando con Identidad Institucional...');
    });

    return () => unsubscribe();
  }, [db, auth]);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setIsUser(false);
    setUser(null);
    sessionStorage.removeItem('tamer_session');
    router.push('/login');
  }, [router]);

  const login = async (identifier: string, password: string, restrictedToObraId?: string) => {
    if (!db || !auth) return false;
    
    const normalizedIdentifier = identifier.toLowerCase().trim();

    try {
      await signInAnonymously(auth);

      // CASO ESPECIAL: Login desde un QR de Obra específico (Acceso Estricto v3.3.6)
      if (restrictedToObraId) {
        const obraRef = doc(db, 'obras', restrictedToObraId);
        const obraSnap = await getDoc(obraRef);
        
        if (obraSnap.exists()) {
          const d = obraSnap.data();
          // Validamos que las credenciales coincidan exactamente con ESTA obra
          if (d.usuarioAcceso?.toLowerCase().trim() === normalizedIdentifier && d.claveAcceso === password) {
            const userData = { ...d, id: obraSnap.id, role: 'field' };
            setIsAdmin(false);
            setIsUser(true);
            setUser(userData);
            sessionStorage.setItem('tamer_session', JSON.stringify(userData));
            return true;
          }
        }
        return false; // Credenciales inválidas para esta obra específica
      }

      // 1. Acceso Maestro Admin
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
        router.push('/dashboard');
        return true;
      }

      // 2. Credenciales Institucionales (Empresa)
      if (empresa) {
        if (normalizedIdentifier === empresa.usuarioAdmin?.toLowerCase().trim() && password === empresa.passwordAdmin) {
          const empresaUserData = {
            email: empresa.usuarioAdmin,
            role: 'admin',
            nombre: empresa.nombre,
            id: 'empresa-global'
          };
          setIsAdmin(true);
          setIsUser(true);
          setUser(empresaUserData);
          sessionStorage.setItem('tamer_session', JSON.stringify(empresaUserData));
          router.push('/dashboard');
          return true;
        }
      }

      // 3. Usuarios Habilitados (Clientes Web)
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
        router.push('/dashboard');
        return true;
      }

      // 4. Accesos Directos de Obra (General)
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
        router.push(`/obra/view?id=${docSnap.id}`);
        return true;
      }

    } catch (error) {
      console.error('Error en proceso de login:', error);
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
