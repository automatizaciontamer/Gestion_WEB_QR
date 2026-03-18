
"use client"

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Upload,
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Obra, ObraFile } from '@/lib/types';
import { uploadToDrive } from '@/lib/drive-api';
import { Progress } from '@/components/ui/progress';

function EditObraContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !obra) return;
    setIsSaving(true);
    
    try {
      const folderName = `${formData.codigoCliente?.trim() || 'Obra'}-${formData.numeroOF?.trim() || 'OF'}-${formData.numeroOT?.trim() || 'OT'}`;
      const newUploadedFiles: ObraFile[] = [];
      
      if (newFilesToUpload.length > 0) {
        for (let i = 0; i < newFilesToUpload.length; i++) {
          const result = await uploadToDrive(newFilesToUpload[i], folderName);
          newUploadedFiles.push({
            name: newFilesToUpload[i].name,
            id: result?.fileId || ''
          });
          setUploadProgress(Math.round(((i + 1) / newFilesToUpload.length) * 100));
        }
      }

      const dataToUpdate = {
        ...formData,
        usuarioAcceso: formData.usuarioAcceso?.toLowerCase().trim() || '',
        files: [...existingFiles, ...newUploadedFiles],
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'obras', id), dataToUpdate);

      toast({
        title: "Obra Actualizada",
        description: "Cambios sincronizados correctamente.",
      });
      
      router.push('/dashboard/obras');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la obra.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-12 h-12" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 pt-16 lg:pt-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl border"><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-3xl font-black text-[#0a3d62]">Editar Proyecto Técnico</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b"><CardTitle className="text-xl font-black">Información de Obra</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Código Cliente</Label><Input id="codigoCliente" value={formData.codigoCliente} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" /></div>
                <div className="space-y-2"><Label>Obra</Label><Input id="nombreObra" value={formData.nombreObra} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Número OF</Label><Input id="numeroOF" value={formData.numeroOF} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" /></div>
                <div className="space-y-2"><Label>Número OT</Label><Input id="numeroOT" value={formData.numeroOT} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label>Cliente</Label><Input id="cliente" value={formData.cliente} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input id="direccion" value={formData.direccion} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" /></div>
              <div className="space-y-2"><Label>URL Carpeta Drive</Label><Input id="driveFolderUrl" value={formData.driveFolderUrl} onChange={handleInputChange} className="h-14 bg-secondary/30 border-none font-bold rounded-xl" placeholder="https://drive.google.com/..." /></div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea id="descripcion" value={formData.descripcion} onChange={handleInputChange} className="bg-secondary/30 border-none min-h-[100px] rounded-xl" /></div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b"><CardTitle className="text-xl font-black">Documentación</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="border-4 border-dashed rounded-[2.5rem] p-10 text-center cursor-pointer bg-secondary/10" onClick={() => document.getElementById('edit-file-input')?.click()}>
                <Upload className="mx-auto w-12 h-12 text-primary opacity-40 mb-2" />
                <p className="font-black">Subir archivos adicionales</p>
                <input id="edit-file-input" type="file" className="hidden" multiple onChange={handleFileChange} />
              </div>
              
              {(existingFiles.length > 0 || newFilesToUpload.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingFiles.map((f, i) => (
                    <div key={`exist-${i}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-bold truncate">{f.name || 'Archivo'}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeExistingFile(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {newFilesToUpload.map((f, i) => (
                    <div key={`new-${i}`} className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Upload className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-black truncate">{f.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeNewFile(i)}>
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
          <Card className="rounded-[3rem] bg-[#0a3d62] text-white p-8 space-y-6 shadow-2xl">
            <div className="space-y-2"><Label>Usuario Acceso</Label><Input id="usuarioAcceso" value={formData.usuarioAcceso} onChange={handleInputChange} className="bg-white/10 border-none h-12 rounded-xl font-bold" /></div>
            <div className="space-y-2"><Label>Clave</Label><Input id="claveAcceso" value={formData.claveAcceso} onChange={handleInputChange} className="bg-white/10 border-none h-12 rounded-xl font-bold" /></div>
          </Card>
          <div className="space-y-4">
            {isSaving && <Progress value={uploadProgress} className="h-2" />}
            <Button type="submit" className="w-full h-20 rounded-[2rem] font-black text-xl bg-primary shadow-2xl" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save className="w-8 h-8 mr-2" />}
              GUARDAR CAMBIOS
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
