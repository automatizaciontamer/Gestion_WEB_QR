
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export const FirebaseErrorListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // No mostrar toast para errores en la carga de configuración inicial (normal si no está logueado aún)
      if (error.context.path.includes('Configuracion/Empresa') && error.context.operation === 'get') {
        console.warn('Acceso denegado a configuración de empresa (normal antes del login)');
        return;
      }

      // Log detallado para depuración contextual
      console.error('--- FIRESTORE PERMISSION DENIED ---');
      console.error('Operación:', error.context.operation);
      console.error('Ruta:', error.context.path);
      if (error.context.requestResourceData) {
        console.error('Datos enviados:', error.context.requestResourceData);
      }
      console.error('-----------------------------------');

      toast({
        variant: "destructive",
        title: "Error de Permisos",
        description: `No tienes autorización para acceder a: ${error.context.path}`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
};
