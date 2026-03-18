'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export const FirebaseErrorListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Log detallado para el desarrollador/agente
      console.error('--- FIRESTORE PERMISSION DENIED ---');
      console.error('Operación:', error.context.operation);
      console.error('Ruta:', error.context.path);
      if (error.context.requestResourceData) {
        console.error('Datos enviados:', error.context.requestResourceData);
      }
      console.error('Contexto Completo:', JSON.stringify(error.context, null, 2));
      console.error('-----------------------------------');

      toast({
        variant: "destructive",
        title: "Error de Seguridad",
        description: `Acceso denegado a ${error.context.path}. Verifica las reglas de Firestore.`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
};
