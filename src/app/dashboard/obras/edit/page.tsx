
"use client"

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  FolderOpen
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

function EditObraContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    
    const dataToUpdate = {
      ...formData,
      usuarioAcceso: formData.usuarioAcceso?.toLowerCase().trim()
    };

    const docRef = doc(db, 'obras', id);
    updateDoc(docRef, dataToUpdate)
      .then(() => {
        toast({
          title: "Obra actualizada",
          description: `Cambios guardados v3.3.4.`,
        });
        router.push('/dashboard/obras');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (!id) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border shadow-sm max-w-md mx-auto mt-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Falta ID</h2>
        <Button onClick={() => router.push('/dashboard/obras')} className="w-full">Volver</Button>
      </div>
    );
  }

  if (loading) return <div className="p-20 text-center">Cargando datos...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Obra</h1>
            <p className="text-sm text-muted-foreground">Tamer Industrial S.A. v3.3.4</p>
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
              <div className="space-y-2">
                <Label htmlFor="driveFolderUrl" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" /> Enlace Carpeta Drive
                </Label>
                <Input id="driveFolderUrl" value={formData.driveFolderUrl || ''} onChange={handleInputChange} placeholder="URL de la carpeta de planos" />
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
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={formData.direccion || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" value={formData.descripcion || ''} onChange={handleInputChange} className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Credenciales QR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioAcceso">Usuario (Email)</Label>
                <Input id="usuarioAcceso" type="email" value={formData.usuarioAcceso || ''} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claveAcceso">Contraseña</Label>
                <div className="relative">
                  <Input id="claveAcceso" type={showPassword ? "text" : "password"} value={formData.claveAcceso || ''} onChange={handleInputChange} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full h-14 bg-primary text-lg font-bold" disabled={isSaving}>
            {isSaving ? "Guardando..." : <><Save className="w-5 h-5 mr-2" /> Guardar Cambios</>}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditObraPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <EditObraContent />
    </Suspense>
  );
}
