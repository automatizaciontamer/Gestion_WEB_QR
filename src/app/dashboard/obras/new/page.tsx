
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Upload,
  FileText,
  X,
  Eye,
  EyeOff,
  CloudUpload,
  Loader2,
  CheckCircle2
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
import { Progress } from '@/components/ui/progress';
import { ObraFile } from '@/lib/types';

export default function NewObraPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
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
    driveFolderUrl: ''
  });

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const folderName = `${formData.codigoCliente.trim()}-${formData.numeroOF.trim()}-${formData.numeroOT.trim()}`;
      const uploadedFiles: ObraFile[] = [];
      
      if (filesToUpload.length > 0) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const result = await uploadToDrive(filesToUpload[i], folderName);
          // Aseguramos que el archivo se guarde incluso si el ID tarda en retornar
          uploadedFiles.push({
            name: filesToUpload[i].name,
            id: result?.fileId || ''
          });
          setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
        }
      }

      const obrasRef = collection(db, 'obras');
      const obraData = {
        ...formData,
        usuarioAcceso: formData.usuarioAcceso.toLowerCase().trim(),
        files: uploadedFiles,
        createdAt: Date.now(),
        serverTimestamp: serverTimestamp(),
        authorizedEmails: []
      };

      await addDoc(obrasRef, obraData);

      toast({
        title: "Obra Registrada v3.7.5",
        description: `Proyecto "${formData.nombreObra}" sincronizado con éxito.`,
      });
      
      router.push('/dashboard/obras');
    } catch (error) {
      toast({
        title: "Error en Sincronización",
        description: "No se pudo conectar con el servidor de Drive.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl hover:bg-white shadow-sm border">
            <ArrowLeft className="w-5 h-5 text-[#0a3d62]" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0a3d62]">Nuevo Proyecto Técnico</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Sincronización Cloud Tamer v3.7.5</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62] flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" /> Ficha Técnica de Obra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="codigoCliente" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Código Cliente</Label>
                  <Input id="codigoCliente" value={formData.codigoCliente} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombreObra" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nombre de la Obra</Label>
                  <Input id="nombreObra" value={formData.nombreObra} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="numeroOF" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Número OF</Label>
                  <Input id="numeroOF" value={formData.numeroOF} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroOT" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Número OT</Label>
                  <Input id="numeroOT" value={formData.numeroOT} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Cliente</Label>
                <Input id="cliente" value={formData.cliente} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Dirección</Label>
                <Input id="direccion" value={formData.direccion} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Descripción</Label>
                <Textarea id="descripcion" value={formData.descripcion} onChange={handleInputChange} className="min-h-[100px] rounded-2xl bg-secondary/30 border-none" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62] flex items-center gap-3">
                <CloudUpload className="w-6 h-6 text-primary" /> Subir Archivos a Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className="border-4 border-dashed border-secondary rounded-[2.5rem] p-12 text-center space-y-4 hover:border-primary/50 transition-all bg-secondary/10 cursor-pointer"
                onClick={() => document.getElementById('new-file-input')?.click()}
              >
                <Upload className="w-16 h-16 text-primary mx-auto opacity-40" />
                <p className="font-black text-lg text-[#0a3d62] uppercase">Seleccionar Documentos</p>
                <input id="new-file-input" type="file" className="hidden" multiple onChange={handleFileChange} />
              </div>
              {filesToUpload.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filesToUpload.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
                      <span className="text-xs font-black truncate max-w-[200px]">{f.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeFile(i)}>
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
          <Card className="border-none shadow-2xl rounded-[3rem] bg-[#0a3d62] text-white overflow-hidden">
            <CardHeader className="p-8 border-b border-white/10">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary" /> Acceso App
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60">Email Usuario</Label>
                <Input id="usuarioAcceso" type="email" value={formData.usuarioAcceso} onChange={handleInputChange} className="h-14 rounded-2xl bg-white/10 border-none font-bold" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60">Contraseña</Label>
                <div className="relative">
                  <Input id="claveAcceso" type={showPassword ? "text" : "password"} value={formData.claveAcceso} onChange={handleInputChange} className="h-14 rounded-2xl bg-white/10 border-none font-bold pr-12" required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isUploading && <Progress value={uploadProgress} className="h-3 rounded-full" />}
            <Button type="submit" className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black text-xl shadow-2xl gap-4" disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin" /> : <Save className="w-8 h-8" />}
              GUARDAR OBRA
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
