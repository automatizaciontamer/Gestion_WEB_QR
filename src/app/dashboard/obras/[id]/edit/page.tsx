"use client"

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Obra } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function EditObraPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Obra>>({});

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  useEffect(() => {
    if (obra) {
      setFormData(obra);
    }
  }, [obra]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id) return;
    setIsSaving(true);
    
    const docRef = doc(db, 'obras', id);
    updateDoc(docRef, formData)
      .then(() => {
        toast({
          title: "Obra actualizada",
          description: `Los cambios en ${formData.nombreObra} se han guardado.`,
        });
        router.push('/dashboard/obras');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: formData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Cargando datos de la obra...</p>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border shadow-sm max-w-md mx-auto mt-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Obra no encontrada</h2>
        <p className="text-muted-foreground mb-6">El registro que intenta editar no existe o no tiene permisos.</p>
        <Button onClick={() => router.push('/dashboard/obras')} className="w-full">Volver al listado</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Obra</h1>
            <p className="text-sm text-muted-foreground">Actualice los detalles técnicos de la obra.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Información Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoCliente">Código Cliente</Label>
                  <Input id="codigoCliente" value={formData.codigoCliente || ''} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombreObra">Nombre de la Obra</Label>
                  <Input id="nombreObra" value={formData.nombreObra || ''} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroOF">Número OF</Label>
                  <Input id="numeroOF" value={formData.numeroOF || ''} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroOT">Número OT</Label>
                  <Input id="numeroOT" value={formData.numeroOT || ''} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Razón Social Cliente</Label>
                <Input id="cliente" value={formData.cliente || ''} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección de Obra</Label>
                <Input id="direccion" value={formData.direccion || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción Técnica</Label>
                <Textarea id="descripcion" value={formData.descripcion || ''} onChange={handleInputChange} className="min-h-[150px]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Credenciales App Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioAcceso">Usuario (Email)</Label>
                <Input id="usuarioAcceso" type="email" value={formData.usuarioAcceso || ''} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claveAcceso">Contraseña de Acceso</Label>
                <Input id="claveAcceso" type="text" value={formData.claveAcceso || ''} onChange={handleInputChange} required />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-14 bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 text-lg font-bold" 
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar Cambios</>}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
