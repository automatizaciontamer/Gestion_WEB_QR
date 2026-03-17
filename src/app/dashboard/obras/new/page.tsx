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
      // Formato solicitado: C-2030-5657-7789 (Codigo Cliente, OF, OT)
      const folderName = `${formData.codigoCliente}-${formData.numeroOF}-${formData.numeroOT}`;
      
      // Subir archivos a Drive
      if (files.length > 0) {
        for (const file of files) {
          await uploadToDrive(file, folderName);
        }
      }

      // Guardar registro en Firestore para sincronización con Android
      const obrasRef = collection(db, 'obras');
      const obraData = {
        ...formData,
        createdAt: Date.now(),
        serverTimestamp: serverTimestamp(),
        authorizedEmails: [] // Inicializar para futuros permisos
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
        description: `La obra ${formData.nombreObra} ha sido registrada y los archivos enviados a Drive.`,
      });
      router.push('/dashboard/obras');
    } catch (error) {
      toast({
        title: "Error al crear la obra",
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
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
            <p className="text-sm text-muted-foreground">Registre los datos técnicos y suba la documentación a Drive.</p>
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
                  <Label htmlFor="codigoCliente">Código Cliente (Ej: C-2030)</Label>
                  <Input id="codigoCliente" placeholder="C-XXXX" value={formData.codigoCliente} onChange={handleInputChange} required />
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
                <Label htmlFor="direccion">Dirección de Obra</Label>
                <Input id="direccion" placeholder="Ubicación física" value={formData.direccion} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción Técnica</Label>
                <Textarea id="descripcion" placeholder="Detalles del montaje, instalación o ingeniería..." className="min-h-[100px]" value={formData.descripcion} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <FileText className="w-5 h-5" /> Documentos (Google Drive)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors bg-secondary/10">
                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Subir Planos y Documentación</p>
                  <p className="text-xs text-muted-foreground">Los archivos se guardarán en la carpeta: {formData.codigoCliente || '...'}-{formData.numeroOF || '...'}-{formData.numeroOT || '...'}</p>
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
                  <p className="text-sm font-semibold">Archivos para procesar ({files.length}):</p>
                  <div className="grid grid-cols-1 gap-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile(idx)}>
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
              <CardTitle className="text-lg text-primary">Credenciales App Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioAcceso">Usuario (Email de la Obra)</Label>
                <Input id="usuarioAcceso" type="email" placeholder="obra-123@tamer.com" value={formData.usuarioAcceso} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claveAcceso">Contraseña de Acceso</Label>
                <Input id="claveAcceso" type="text" placeholder="Ej. Tamer2024" value={formData.claveAcceso} onChange={handleInputChange} required />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight bg-secondary/50 p-2 rounded">
                Estas credenciales son las que utilizará el personal en campo para acceder a esta obra específica desde la app Android.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-secondary rounded-xl flex flex-col items-center justify-center border border-dashed text-muted-foreground gap-2">
                <ImageIcon className="w-8 h-8 opacity-20" />
                <p className="text-[10px] uppercase font-bold tracking-wider">Imagen de Portada</p>
                <Button type="button" variant="outline" size="xs" disabled>Próximamente</Button>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-14 bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 text-lg font-bold" 
            disabled={isUploading}
          >
            {isUploading ? "Subiendo a Drive..." : <><Save className="w-5 h-5" /> Guardar y Publicar</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
