
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export const FirebaseErrorListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Ignorar errores de permisos en Configuracion/Empresa durante la carga inicial v2.9
      // Es normal si el usuario aún no se ha autenticado de forma anónima
      if (error.context.path.includes('Configuracion/Empresa')) {
        return;
      }

      // Log para desarrollo contextual
      console.warn('--- FIRESTORE PERMISSION RESTRICTED ---');
      console.warn('Operación:', error.context.operation);
      console.warn('Ruta:', error.context.path);
      console.warn('---------------------------------------');

      toast({
        variant: "destructive",
        title: "Error de Acceso Cloud",
        description: `Verifique los permisos para: ${error.context.path}`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
};
