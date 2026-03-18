"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Upload,
  FileText,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { uploadToDrive } from '@/lib/drive-api';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function NewObraPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    numeroOF: '',
    numeroOT: '',
    codigoCliente: '',
    nombreObra: '',
    cliente: '',
    direccion: '',
    descripcion: '',
    usuarioAcceso: '',
    claveAcceso: '',
  });

  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsUploading(true);
    
    try {
      const folderName = `${formData.codigoCliente}-${formData.numeroOF}-${formData.numeroOT}`;
      const fileNames = files.map(f => f.name);
      
      // Subir archivos a Drive
      if (files.length > 0) {
        for (const file of files) {
          await uploadToDrive(file, folderName);
        }
      }

      // Guardar registro en Firestore
      const obrasRef = collection(db, 'obras');
      const obraData = {
        ...formData,
        files: fileNames,
        createdAt: Date.now(),
        serverTimestamp: serverTimestamp(),
        authorizedEmails: []
      };

      addDoc(obrasRef, obraData)
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: obrasRef.path,
            operation: 'create',
            requestResourceData: obraData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

      toast({
        title: "Obra creada exitosamente",
        description: `La obra ${formData.nombreObra} ha sido registrada.`,
      });
      router.push('/dashboard/obras');
    } catch (error) {
      toast({
        title: "Error al crear la obra",
        description: error instanceof Error ? error.message : "Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva Obra</h1>
            <p className="text-sm text-muted-foreground">Tamer Industrial S.A. - Registro Técnico</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Información de Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoCliente">Código Cliente</Label>
                  <Input id="codigoCliente" placeholder="Ej: C-2030" value={formData.codigoCliente} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombreObra">Nombre de la Obra</Label>
                  <Input id="nombreObra" placeholder="Título del proyecto" value={formData.nombreObra} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroOF">Número OF</Label>
                  <Input id="numeroOF" placeholder="OF-0000" value={formData.numeroOF} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroOT">Número OT</Label>
                  <Input id="numeroOT" placeholder="OT-0000" value={formData.numeroOT} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Razón Social Cliente</Label>
                <Input id="cliente" placeholder="Empresa contratante" value={formData.cliente} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" placeholder="Ubicación física" value={formData.direccion} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción Técnica</Label>
                <Textarea id="descripcion" placeholder="Detalles técnicos..." className="min-h-[100px]" value={formData.descripcion} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <FileText className="w-5 h-5" /> Documentos Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors bg-secondary/10">
                <Upload className="w-10 h-10 text-primary mx-auto opacity-50" />
                <div>
                  <p className="font-medium text-sm">Arrastre planos o archivos PDF aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">Se guardarán en la carpeta de Drive vinculada.</p>
                </div>
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    Seleccionar Archivos
                    <input type="file" className="hidden" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
                  </label>
                </Button>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Archivos Seleccionados ({files.length})</p>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFile(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Acceso App Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioAcceso">Usuario de Obra</Label>
                <Input id="usuarioAcceso" type="email" placeholder="obra@tamer.com" value={formData.usuarioAcceso} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claveAcceso">Clave de Acceso</Label>
                <Input id="claveAcceso" type="text" placeholder="Contraseña de campo" value={formData.claveAcceso} onChange={handleInputChange} required />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-14 bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 text-lg font-bold" 
            disabled={isUploading}
          >
            {isUploading ? "Procesando..." : <><Save className="w-5 h-5" /> Guardar Obra</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
