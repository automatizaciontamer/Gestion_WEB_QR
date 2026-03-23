"use client"

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Upload,
  X,
  FileText,
  CloudUpload,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Obra, ObraFile } from '@/lib/types';
import { uploadToDrive, deleteFromDrive, createFolderOnDrive } from '@/lib/drive-api';
import { Progress } from '@/components/ui/progress';


function EditObraContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    codigoCliente: '',
    nombreObra: '',
    numeroOF: '',
    numeroOT: '',
    cliente: '',
    descripcion: '',
    usuarioAcceso: '',
    claveAcceso: '',
    driveFolderUrl: '',
    direccion: ''
  });
  
  const [existingFiles, setExistingFiles] = useState<ObraFile[]>([]);
  const [newFilesToUpload, setNewFilesToUpload] = useState<File[]>([]);
  const [filesToDeleteFromDrive, setFilesToDeleteFromDrive] = useState<string[]>([]);

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  useEffect(() => {
    if (obra) {
      setFormData({
        codigoCliente: obra.codigoCliente || '',
        nombreObra: obra.nombreObra || '',
        numeroOF: obra.numeroOF || '',
        numeroOT: obra.numeroOT || '',
        cliente: obra.cliente || '',
        descripcion: obra.descripcion || '',
        usuarioAcceso: obra.usuarioAcceso || '',
        claveAcceso: obra.claveAcceso || '',
        driveFolderUrl: obra.driveFolderUrl || '',
        direccion: obra.direccion || ''
      });
      setExistingFiles(obra.files || []);
    }
  }, [obra]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    const fileToRemove = existingFiles[index];
    if (!confirm(`¿Deseas eliminar permanentemente el archivo "${fileToRemove.name || 'documento'}"?`)) return;
    
    if (fileToRemove.id) {
      setFilesToDeleteFromDrive(prev => [...prev, fileToRemove.id]);
    }
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !obra) return;
    setIsSaving(true);
    
    try {
      // 1. ELIMINACIÓN DE ARCHIVOS INDIVIDUALES EN DRIVE
      if (filesToDeleteFromDrive.length > 0) {
        for (const fileId of filesToDeleteFromDrive) {
          const deleteResult = await deleteFromDrive(fileId);
          if (deleteResult && deleteResult.status !== 'success') {
            console.warn(`Drive no confirmó borrado para el archivo ${fileId}:`, deleteResult?.message);
          }
        }
      }

      const folderName = `${formData.codigoCliente.trim()}-${formData.numeroOF.trim()}-${formData.numeroOT.trim()}`;
      
      // Asegurar existencia de carpeta en Drive v5.2.0
      await createFolderOnDrive(folderName);

      const newUploadedFiles: ObraFile[] = [];

      
      if (newFilesToUpload.length > 0) {
        for (let i = 0; i < newFilesToUpload.length; i++) {
          const result = await uploadToDrive(newFilesToUpload[i], folderName);
          
          if (result && result.status === 'success') {
            newUploadedFiles.push({
              name: newFilesToUpload[i].name || 'Archivo sin nombre',
              id: result.fileId || '',
              url: result.url || '' 
            });
          }
          setUploadProgress(Math.round(((i + 1) / newFilesToUpload.length) * 100));
        }
      }

      // LIMPIEZA DE DATOS: Asegurar que NADA sea undefined antes de Firestore
      let dataToUpdate: any = {
        codigoCliente: formData.codigoCliente || '',
        nombreObra: formData.nombreObra || '',
        numeroOF: formData.numeroOF || '',
        numeroOT: formData.numeroOT || '',
        cliente: formData.cliente || '',
        direccion: formData.direccion || '',
        descripcion: formData.descripcion || '',
        usuarioAcceso: (formData.usuarioAcceso || '').toLowerCase().trim(),
        claveAcceso: formData.claveAcceso || '',
        driveFolderUrl: formData.driveFolderUrl || '',
        files: [...existingFiles, ...newUploadedFiles],
        updatedAt: Date.now()
      };

      // Inyección o preservación de Credenciales Maestras de la Empresa
      try {
        const eqRef = doc(db, 'Configuracion', 'Empresa');
        const eqSnap = await getDoc(eqRef);
        if (eqSnap.exists()) {
          const eqData = eqSnap.data();
          const currentAuthorized = obra!.authorizedEmails || [];
          
          let updatedAuthorized = [...currentAuthorized];
          
          // Helper para agregar si no existe
          const addIfNotExists = (email: string, pass: string) => {
            if (email && pass && !updatedAuthorized.some(e => e.email === email && e.password === pass)) {
              updatedAuthorized.push({ email, password: pass });
            }
          };

          if (eqData.email && eqData.claveAccesoInfo) {
             addIfNotExists(eqData.email.toLowerCase().trim(), eqData.claveAccesoInfo);
          }
          if (eqData.usuarioAdmin && eqData.passwordAdmin) {
             addIfNotExists(eqData.usuarioAdmin.toLowerCase().trim(), eqData.passwordAdmin);
          }
          
          dataToUpdate.authorizedEmails = updatedAuthorized;
        }
      } catch (e) { console.warn("No se pudo inyectar empresa en edición", e) }

      await updateDoc(doc(db, 'obras', id), dataToUpdate);

      toast({
        title: "Cambios Guardados",
        description: "Actualización completada correctamente.",
      });
      
      router.push('/dashboard/obras');
    } catch (error: any) {
      console.error("Error en update:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la obra.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin w-12 h-12 text-primary" />
      <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Conectando con Servidor...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 pt-16 lg:pt-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl border shadow-sm">
          <ArrowLeft className="w-5 h-5 text-[#0a3d62]" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-[#0a3d62]">Editar Proyecto</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sincronización v5.2.0</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62]">Información Técnica</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Código Cliente</Label>
                  <Input id="codigoCliente" value={formData.codigoCliente || ''} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Nombre Obra</Label>
                  <Input id="nombreObra" value={formData.nombreObra || ''} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-2xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Número OF</Label>
                  <Input id="numeroOF" value={formData.numeroOF || ''} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Número OT</Label>
                  <Input id="numeroOT" value={formData.numeroOT || ''} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-2xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Cliente / Razón Social</Label>
                <Input id="cliente" value={formData.cliente || ''} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Dirección de Obra</Label>
                <Input id="direccion" value={formData.direccion || ''} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Descripción Técnica</Label>
                <Textarea id="descripcion" value={formData.descripcion || ''} onChange={handleInputChange} className="bg-secondary/30 border-none min-h-[120px] rounded-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62]">Documentación Sincronizada</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className="border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer bg-secondary/10 hover:bg-secondary/20 transition-all border-secondary" 
                onClick={() => document.getElementById('edit-file-input')?.click()}
              >
                <Upload className="mx-auto w-12 h-12 text-primary opacity-40 mb-3" />
                <p className="font-black text-[#0a3d62]">SUBIR NUEVOS PLANOS</p>
                <input id="edit-file-input" type="file" className="hidden" multiple onChange={handleFileChange} />
              </div>
              
              {(existingFiles.length > 0 || newFilesToUpload.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {existingFiles.map((f, i) => (
                    <div key={`exist-${i}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-xs font-black truncate text-[#0a3d62]">{f.name || 'Documento'}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => removeExistingFile(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {newFilesToUpload.map((f, i) => (
                    <div key={`new-${i}`} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border animate-pulse">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <CloudUpload className="w-5 h-5 text-blue-500 shrink-0" />
                        <span className="text-xs font-black truncate text-blue-900">{f.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => removeNewFile(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[3.5rem] bg-[#0a3d62] text-white p-10 space-y-8 shadow-2xl border-none">
            <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" /> ACCESO TÉCNICO
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Usuario / Email</Label>
                <Input id="usuarioAcceso" value={formData.usuarioAcceso || ''} onChange={handleInputChange} className="bg-white/10 border-none h-14 rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Contraseña</Label>
                <div className="relative">
                  <Input id="claveAcceso" type={showPassword ? "text" : "password"} value={formData.claveAcceso || ''} onChange={handleInputChange} className="bg-white/10 border-none h-14 rounded-2xl font-bold pr-12" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="space-y-4">
            {isSaving && <Progress value={uploadProgress} className="h-2 rounded-full" />}
            <Button type="submit" className="w-full h-24 rounded-[2.5rem] font-black text-2xl bg-primary shadow-2xl shadow-primary/30 transition-all active:scale-95" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin w-8 h-8" /> : <Save className="w-8 h-8 mr-3" />}
              {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditObraPage() {
  return <Suspense><EditObraContent /></Suspense>;
}
