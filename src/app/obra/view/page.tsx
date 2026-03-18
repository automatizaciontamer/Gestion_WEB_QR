
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, Suspense, useState } from 'react';
import { Obra } from '@/lib/types';
import { 
  FileText, 
  Download, 
  Construction, 
  MapPin, 
  Loader2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  FolderOpen,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();
  const { isUser, user, isAdmin, login, logout, empresa, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading: docLoading } = useDoc<Obra>(obraDocRef);

  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    if (isAdmin) return true;
    
    if (user.role === 'field') {
      const normalizedUserEmail = user.email?.toLowerCase().trim();
      const normalizedObraEmail = obra.usuarioAcceso?.toLowerCase().trim();
      
      return normalizedUserEmail === normalizedObraEmail || 
             obra.authorizedEmails?.some(e => e.email?.toLowerCase().trim() === normalizedUserEmail);
    }
    
    return false;
  }, [isUser, user, obra, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsLoggingIn(true);
    
    try {
      const success = await login(identifier, password, id);
      if (!success) {
        toast({
          variant: "destructive",
          title: "Acceso Denegado",
          description: "Credenciales inválidas para este proyecto.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de Conexión",
        description: "No se pudo validar el acceso.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Iniciando Visor v3.7.5...</p>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-10 max-w-sm w-full border-none shadow-2xl rounded-[3rem] text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase tracking-tight">Proyecto No Encontrado</h1>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8">IR AL PANEL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 text-center text-white space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/20">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Acceso Técnico Obra</h2>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl text-center border">
              <p className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">PROYECTO IDENTIFICADO:</p>
              <h3 className="font-black text-lg text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                placeholder="Usuario de Obra"
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                className="h-14 rounded-2xl font-bold bg-slate-50 border-none shadow-inner" 
                required 
              />
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Contraseña"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="h-14 rounded-2xl font-bold bg-slate-50 border-none shadow-inner" 
                  required 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              <Button type="submit" className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/95 rounded-[1.5rem] font-black text-lg shadow-xl" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : "ACCEDER A DOCUMENTACIÓN"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const files = obra.files || [];
  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra.driveFolderUrl;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-[#0a3d62] text-white shadow-2xl z-10">
        <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl border-4 border-white/20">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-8 h-8" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Tamer Cloud v3.7.5</p>
                <h2 className="text-sm font-black text-white/60 uppercase truncate max-w-[150px]">{empresa?.nombre || 'Tamer Industrial'}</h2>
              </div>
            </div>
            <Button variant="ghost" onClick={logout} className="text-white border border-white/20 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" /> SALIR
            </Button>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h1 className="text-3xl sm:text-5xl font-black uppercase leading-[1.1] text-white">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary text-white font-black text-xs px-4 py-2 rounded-xl uppercase shadow-lg">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white font-black text-xs px-4 py-2 rounded-xl uppercase border border-white/10 backdrop-blur-sm">OT: {obra.numeroOT}</div>
              <div className="bg-white/10 text-white font-black text-xs px-4 py-2 rounded-xl uppercase border border-white/10 backdrop-blur-sm">CÓDIGO: {obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-10 space-y-8 flex-1">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-slate-100">
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2">Cliente / Razón Social:</p>
              <p className="font-black text-[#0a3d62] text-xl uppercase leading-tight">{obra.cliente}</p>
            </div>
            <div className="p-8">
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2">Ubicación de Obra:</p>
              <div className="flex items-start gap-3 font-bold text-[#0a3d62]">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                <span className="text-base leading-tight uppercase">{obra.direccion || 'Consultar Oficina Técnica'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <h3 className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.5em] flex items-center gap-3 px-2">
            <FileText className="w-6 h-6 text-primary" /> DOCUMENTACIÓN TÉCNICA SINCRONIZADA
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {hasFiles ? (
              files.map((file, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 flex items-center justify-between gap-6 hover:translate-y-[-2px] transition-all">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shrink-0 border">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0a3d62] text-lg truncate uppercase leading-tight">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Documento Listo</p>
                      </div>
                    </div>
                  </div>
                  {file.id && (
                    <Button asChild className="h-14 w-14 rounded-2xl bg-[#0a3d62] hover:bg-primary shadow-xl shrink-0 transition-colors">
                      <a href={`https://drive.google.com/uc?id=${file.id}&export=download`} target="_blank" rel="noopener noreferrer">
                        <Download className="w-6 h-6" />
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : null}

            {hasFolderUrl && (
              <Button asChild className="w-full h-24 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/95 font-black text-lg gap-6 shadow-2xl mt-4 border-l-8 border-primary group">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <FolderOpen className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left flex-1">
                    <p className="uppercase tracking-tight leading-none text-white">REPOSITORIO COMPLETO DE PLANOS</p>
                    <p className="text-[9px] opacity-60 font-black tracking-widest uppercase mt-2">Acceso directo a Google Drive</p>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-40" />
                </a>
              </Button>
            )}

            {!hasFiles && !hasFolderUrl && (
              <div className="bg-white p-20 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h4 className="font-black text-[#0a3d62] uppercase text-sm tracking-widest">Sin Archivos Vinculados</h4>
                <p className="text-xs text-muted-foreground font-bold mt-4 uppercase max-w-xs mx-auto">Contacte con la oficina técnica para sincronizar la documentación de este proyecto.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-10 text-center border-t bg-white/50 backdrop-blur-sm">
        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.6em]">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | GESTIÓN CLOUD v3.7.5
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-black uppercase text-xs tracking-widest">Cargando aplicación técnica...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
