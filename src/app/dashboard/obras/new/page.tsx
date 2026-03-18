
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
  FolderOpen,
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Progress } from '@/components/ui/progress';

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
    setUploadProgress(0);
    
    try {
      // 1. Definir nombre de carpeta según requerimiento: CODIGO CLIENTE-OF-OT
      const folderName = `${formData.codigoCliente.trim()}-${formData.numeroOF.trim()}-${formData.numeroOT.trim()}`;
      const fileNames = files.map(f => f.name);
      
      // 2. Subir archivos a Drive secuencialmente
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          await uploadToDrive(files[i], folderName);
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }
      }

      // 3. Guardar registro técnico en Firestore
      const obrasRef = collection(db, 'obras');
      const obraData = {
        ...formData,
        usuarioAcceso: formData.usuarioAcceso.toLowerCase().trim(),
        files: fileNames,
        createdAt: Date.now(),
        serverTimestamp: serverTimestamp(),
        authorizedEmails: []
      };

      await addDoc(obrasRef, obraData);

      toast({
        title: "Obra Registrada v3.3.8",
        description: `La carpeta "${folderName}" se ha creado en Drive con ${files.length} archivos.`,
      });
      
      router.push('/dashboard/obras');
    } catch (error) {
      toast({
        title: "Error en Sincronización",
        description: error instanceof Error ? error.message : "No se pudo conectar con el servidor.",
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
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">
              Sincronización Cloud Tamer v3.3.8
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Datos del Proyecto */}
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
                  <Label htmlFor="codigoCliente" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Código Cliente (ID)</Label>
                  <Input id="codigoCliente" placeholder="Ej: C-2030" value={formData.codigoCliente} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombreObra" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nombre del Proyecto</Label>
                  <Input id="nombreObra" placeholder="Título de la Obra" value={formData.nombreObra} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="numeroOF" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Número de OF</Label>
                  <Input id="numeroOF" placeholder="OF-0000" value={formData.numeroOF} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroOT" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Número de OT</Label>
                  <Input id="numeroOT" placeholder="OT-0000" value={formData.numeroOT} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Razón Social Cliente</Label>
                <Input id="cliente" placeholder="Nombre de la empresa contratante" value={formData.cliente} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Dirección de Instalación</Label>
                <Input id="direccion" placeholder="Ubicación física de la obra" value={formData.direccion} onChange={handleInputChange} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Descripción Técnica / Alcance</Label>
                <Textarea id="descripcion" placeholder="Detalles específicos del proyecto..." className="min-h-[120px] rounded-2xl bg-secondary/30 border-none font-medium p-4" value={formData.descripcion} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          {/* Sección de Carga de Archivos */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-8 border-b">
              <CardTitle className="text-xl font-black text-[#0a3d62] flex items-center gap-3">
                <CloudUpload className="w-6 h-6 text-primary" /> Documentación y Planos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className="border-4 border-dashed border-secondary rounded-[2.5rem] p-12 text-center space-y-4 hover:border-primary/50 transition-all bg-secondary/10 group cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-16 h-16 text-primary mx-auto opacity-40 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-black text-lg text-[#0a3d62] uppercase tracking-tight">Seleccionar Archivos de Ingeniería</p>
                  <p className="text-xs text-muted-foreground font-bold mt-2">Los archivos se subirán a la carpeta: <br/><span className="text-primary font-black uppercase">{formData.codigoCliente || '...'}-{formData.numeroOF || '...'}-{formData.numeroOT || '...'}</span></p>
                </div>
                <input id="file-upload" type="file" className="hidden" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
              </div>

              {files.length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between px-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cola de Sincronización ({files.length} archivos)</p>
                    <Button type="button" variant="ghost" className="text-[10px] font-black uppercase text-destructive" onClick={() => setFiles([])}>Limpiar todo</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-xs font-black text-[#0a3d62] truncate">{file.name}</span>
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

        {/* Columna Derecha: Accesos y Acciones */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-[#0a3d62] text-white overflow-hidden">
            <CardHeader className="p-8 border-b border-white/10">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary" /> Acceso QR / App
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Usuario de Obra (Email)</Label>
                <Input id="usuarioAcceso" type="email" placeholder="obra@tamer.com" value={formData.usuarioAcceso} onChange={handleInputChange} className="h-14 rounded-2xl bg-white/10 border-none font-bold text-lg text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Clave de Acceso Técnico</Label>
                <div className="relative">
                  <Input 
                    id="claveAcceso" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Contraseña" 
                    className="h-14 rounded-2xl bg-white/10 border-none font-bold text-lg text-white pr-14"
                    value={formData.claveAcceso} 
                    onChange={handleInputChange} 
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Enlace Directo a Carpeta Drive (Opcional)</Label>
                <Input id="driveFolderUrl" placeholder="https://drive.google.com/..." value={formData.driveFolderUrl} onChange={handleInputChange} className="h-14 rounded-2xl bg-white/10 border-none font-bold text-xs text-primary" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isUploading && (
              <div className="space-y-2 px-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0a3d62]">
                  <span>Subiendo a Drive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-3 rounded-full bg-secondary" />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 gap-4 transition-all active:scale-95 group" 
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  SINCRONIZANDO...
                </>
              ) : (
                <>
                  <Save className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  GUARDAR OBRA
                </>
              )}
            </Button>
            
            <p className="text-[9px] text-center font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed px-8">
              Al guardar, se creará automáticamente la estructura técnica en Google Drive para Tamer Industrial S.A.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
