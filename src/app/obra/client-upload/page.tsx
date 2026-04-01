"use client"

import { useSearchParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useMemo, Suspense, useState } from 'react';
import { Obra, ObraFile } from '@/lib/types';
import { 
  FileText, 
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Upload,
  X,
  CloudUpload,
  CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { uploadToDrive, createFolderOnDrive } from '@/lib/drive-api';
import { Progress } from '@/components/ui/progress';

function ClientUploadContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();
  const { toast } = useToast();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef as any);
  
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Iniciando Portal Cliente...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-emerald-800 uppercase">Obra no encontrada</h1>
        </div>
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    
    const validUser = obra.usuarioCliente?.toLowerCase().trim();
    const validPass = obra.claveCliente;

    if (validUser && validPass && 
        usuario.toLowerCase().trim() === validUser && 
        clave === validPass) {
      setIsAuthorized(true);
    } else {
      setAuthError(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!db || filesToUpload.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Formato plano solicitado por el usuario para Drive: INFO CLIENTE - CODIGO-OF-OT
      const parentFolderName = `${obra.codigoCliente?.trim()}-${obra.numeroOF?.trim()}-${obra.numeroOT?.trim()}`;
      const folderName = `INFO CLIENTE`;
      
      await createFolderOnDrive(folderName, parentFolderName);

      const newUploadedFiles: ObraFile[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const result = await uploadToDrive(filesToUpload[i], folderName, parentFolderName);
        
        if (result && result.status === 'success') {
          newUploadedFiles.push({
            name: filesToUpload[i].name || 'Archivo de Cliente',
            id: result.fileId || '',
            url: result.url || '' 
          });
        }
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      // Añadir al arreglo de files de la base de datos para que lo vea la empresa
      const existingFiles = obra.files || [];
      await updateDoc(doc(db, 'obras', id), {
        files: [...existingFiles, ...newUploadedFiles]
      });

      toast({
        title: "¡Éxito!",
        description: "Los archivos se han enviado correctamente.",
      });

      setFilesToUpload([]);

    } catch (error: any) {
      console.error("Error al subir:", error);
      toast({
        title: "Error de Envío",
        description: "Ocurrió un problema enviando los archivos. Intente de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-[#047857] text-white py-12 px-6 border-b-8 border-emerald-400 shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl">
              <CloudUpload className="text-[#047857] w-7 h-7" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-300">TAMER INDUSTRIAL S.A.</p>
              <h2 className="text-xs font-black uppercase opacity-80">Portal de Clientes v5.2.0</h2>
            </div>
          </div>
          
          <div className="pt-4">
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-emerald-600 text-white text-[10px] font-black px-5 py-2 rounded-lg shadow-inner">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white text-[10px] font-black px-5 py-2 rounded-lg shadow-inner">OT: {obra.numeroOT}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-12 space-y-12 flex-1">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-emerald-50 p-10">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mb-1">Cliente / Razón Social</p>
          <p className="font-black text-2xl text-emerald-900 uppercase leading-none">{obra.cliente}</p>
        </div>

        <div className="space-y-6">
          <h3 className="text-[12px] font-black text-emerald-800 uppercase tracking-[0.4em] flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-500" /> ENVÍO DE DOCUMENTACIÓN
          </h3>

          {!isAuthorized ? (
            <Card className="w-full bg-white rounded-[3.5rem] shadow-2xl border-none overflow-hidden pb-4 relative mt-10">
              <div className="bg-[#047857] p-10 pt-16 text-center text-white relative">
                 <div className="w-20 h-20 bg-white shadow-xl flex items-center justify-center rounded-[2rem] mx-auto absolute -top-10 left-1/2 -translate-x-1/2">
                    <Lock className="w-8 h-8 text-emerald-600" />
                 </div>
                 <h2 className="font-black text-xl uppercase tracking-widest">Acceso Privado</h2>
                 <p className="text-[10px] uppercase font-black tracking-widest text-[#047857] bg-emerald-400 px-4 py-2 mt-4 rounded-full absolute top-[100%] left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-white whitespace-nowrap shadow-lg">Requiere Identificación</p>
              </div>
              <CardContent className="p-10 pt-16 space-y-6">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Usuario Cliente</label>
                      <Input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} required className="h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg focus-visible:ring-emerald-500" placeholder="Su usuario corporativo..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Clave de Acceso</label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={clave} onChange={e => setClave(e.target.value)} required className="h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg pr-12 focus-visible:ring-emerald-500" placeholder="••••••••" />
                        <Button type="button" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {authError && <div className="bg-red-50 text-destructive text-center text-[10px] font-black uppercase tracking-wider p-3 rounded-xl mt-4 animate-pulse border border-red-100">🚫 Credenciales Inválidas</div>}
                  <Button type="submit" className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl gap-3 mt-6 rounded-[2rem] shadow-xl shadow-emerald-500/30 transition-all active:scale-95">
                     INGRESAR AL PORTAL
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden border-2 border-emerald-50">
              <CardHeader className="bg-emerald-50/50 p-8 border-b border-emerald-100">
                <CardTitle className="text-xl font-black text-emerald-800 flex items-center gap-3">
                  <CloudUpload className="w-6 h-6 text-emerald-600" /> Subir Archivos a Drive
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div 
                  className="border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 transition-all border-emerald-200" 
                  onClick={() => document.getElementById('client-file-input')?.click()}
                >
                  <Upload className="mx-auto w-12 h-12 text-emerald-600 opacity-60 mb-3" />
                  <p className="font-black text-emerald-800 tracking-wide">SELECCIONAR DOCUMENTOS</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Los archivos serán procesados por ingeniería</p>
                  <input id="client-file-input" type="file" className="hidden" multiple onChange={handleFileChange} />
                </div>
                
                {filesToUpload.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {filesToUpload.map((f, i) => (
                      <div key={`new-${i}`} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black truncate text-emerald-900">{f.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => removeFile(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {filesToUpload.length > 0 && (
                  <div className="pt-6 border-t border-emerald-50 space-y-4">
                    {isUploading && <Progress value={uploadProgress} className="h-2 rounded-full" />}
                    <Button 
                      onClick={handleUpload} 
                      disabled={isUploading}
                      className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-500/30 transition-all active:scale-95 gap-3"
                    >
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                      {isUploading ? 'ENVIANDO...' : 'CONFIRMAR Y ENVIAR'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="p-12 text-center mt-auto">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">
          TAMER INDUSTRIAL S.A. | PORTAL CLIENTES v5.2.0
        </p>
      </footer>
    </div>
  );
}

export default function ClientUploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest text-emerald-700">Iniciando Portal...</div>}>
      <ClientUploadContent />
    </Suspense>
  );
}
