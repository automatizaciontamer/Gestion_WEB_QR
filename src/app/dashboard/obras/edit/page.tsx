
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
  FolderOpen,
  Upload,
  X,
  FileText,
  CloudUpload
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
import { uploadToDrive } from '@/lib/drive-api';
import { Progress } from '@/components/ui/progress';

function EditObraContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<Obra>>({});
  const [newFiles, setNewFiles] = useState<File[]>([]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !obra) return;
    setIsSaving(true);
    
    try {
      // 1. Definir nombre de carpeta (debe coincidir con el original para no duplicar)
      const folderName = `${formData.codigoCliente?.trim()}-${formData.numeroOF?.trim()}-${formData.numeroOT?.trim()}`;
      const newFileNames = newFiles.map(f => f.name);
      
      // 2. Subir nuevos archivos a Drive si existen
      if (newFiles.length > 0) {
        setIsUploading(true);
        for (let i = 0; i < newFiles.length; i++) {
          await uploadToDrive(newFiles[i], folderName);
          setUploadProgress(Math.round(((i + 1) / newFiles.length) * 100));
        }
        setIsUploading(false);
      }

      // 3. Preparar datos para Firestore actualizando la lista de archivos
      const existingFiles = obra.files || [];
      const updatedFileList = Array.from(new Set([...existingFiles, ...newFileNames]));

      const dataToUpdate = {
        ...formData,
        usuarioAcceso: formData.usuarioAcceso?.toLowerCase().trim(),
        files: updatedFileList,
        updatedAt: Date.now()
      };

      const docRef = doc(db, 'obras', id);
      await updateDoc(docRef, dataToUpdate);

      toast({
        title: "Obra Actualizada v3.4.0",
        description: `Se han guardado los cambios y sincronizado ${newFiles.length} archivos nuevos en la carpeta "${folderName}".`,
      });
      
      router.push('/dashboard/obras');
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: `obras/${id}`,
        operation: 'update',
        requestResourceData: formData,
      });
      errorEmitter.emit('permission-error', permissionError);
      
      toast({
        title: "Error de Sincronización",
        description: "No se pudieron subir los archivos o actualizar la base de datos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
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

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-[#0a3d62]" />
      <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Cargando datos técnicos...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl hover:bg-white shadow-sm border">
            <ArrowLeft className="w-5 h-5 text-[#0a3d62]" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0a3d62]">Editar Proyecto Técnico</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Sincronización Cloud Tamer v3.4.0</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Información y Archivos */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62] flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" /> Información Técnica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="codigoCliente" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Código Cliente</Label>
                  <Input id="codigoCliente" value={formData.codigoCliente || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombreObra" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nombre de la Obra</Label>
                  <Input id="nombreObra" value={formData.nombreObra || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driveFolderUrl" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" /> Enlace Carpeta Drive (Existente)
                </Label>
                <Input id="driveFolderUrl" value={formData.driveFolderUrl || ''} onChange={handleInputChange} placeholder="URL de la carpeta de planos" className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-xs text-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="numeroOF" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Número OF</Label>
                  <Input id="numeroOF" value={formData.numeroOF || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroOT" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Número OT</Label>
                  <Input id="numeroOT" value={formData.numeroOT || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Razón Social Cliente</Label>
                <Input id="cliente" value={formData.cliente || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Dirección</Label>
                <Input id="direccion" value={formData.direccion || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Descripción</Label>
                <Textarea id="descripcion" value={formData.descripcion || ''} onChange={handleInputChange} className="min-h-[120px] rounded-2xl bg-secondary/30 border-none font-medium p-4" />
              </div>
            </CardContent>
          </Card>

          {/* Sección de Nuevos Archivos */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62] flex items-center gap-3">
                <CloudUpload className="w-6 h-6 text-primary" /> Añadir Planos / Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className="border-4 border-dashed border-secondary rounded-[2.5rem] p-12 text-center space-y-4 hover:border-primary/50 transition-all bg-secondary/10 group cursor-pointer"
                onClick={() => document.getElementById('edit-file-upload')?.click()}
              >
                <Upload className="w-16 h-16 text-primary mx-auto opacity-40 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-black text-lg text-[#0a3d62] uppercase tracking-tight">Seleccionar Nuevos Archivos</p>
                  <p className="text-xs text-muted-foreground font-bold mt-2">Se subirán a la carpeta: <br/><span className="text-primary font-black uppercase">{formData.codigoCliente || '...'}-{formData.numeroOF || '...'}-{formData.numeroOT || '...'}</span></p>
                </div>
                <input id="edit-file-upload" type="file" className="hidden" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
              </div>

              {newFiles.length > 0 && (
                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Archivos nuevos por sincronizar ({newFiles.length})</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-xs font-black text-[#0a3d62] truncate">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeNewFile(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {obra.files && obra.files.length > 0 && (
                <div className="pt-8 border-t">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 mb-4">Documentación ya sincronizada ({obra.files.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {obra.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl border border-transparent">
                        <FileText className="w-4 h-4 text-[#0a3d62]/40" />
                        <span className="text-[10px] font-bold text-[#0a3d62]/60 truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Accesos y Botón Guardar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-[#0a3d62] text-white overflow-hidden">
            <CardHeader className="p-8 border-b border-white/10">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" /> Credenciales QR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Usuario de Obra (Email)</Label>
                <Input id="usuarioAcceso" type="email" value={formData.usuarioAcceso || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-white/10 border-none font-bold text-lg text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Clave de Acceso</Label>
                <div className="relative">
                  <Input id="claveAcceso" type={showPassword ? "text" : "password"} value={formData.claveAcceso || ''} onChange={handleInputChange} className="h-14 rounded-2xl bg-white/10 border-none font-bold text-lg text-white pr-14" required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isUploading && (
              <div className="space-y-2 px-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0a3d62]">
                  <span>Subiendo nuevos archivos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-3 rounded-full bg-secondary" />
              </div>
            )}
            
            <Button type="submit" className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 gap-4 transition-all active:scale-95 group" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  GUARDANDO...
                </>
              ) : (
                <>
                  <Save className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  GUARDAR CAMBIOS
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditObraPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Iniciando editor técnico...</p>
    </div>}>
      <EditObraContent />
    </Suspense>
  );
}
