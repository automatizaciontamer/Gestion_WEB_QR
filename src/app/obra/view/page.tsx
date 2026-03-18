
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, Suspense, useState, useEffect } from 'react';
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
  ArrowRight,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    
    if (user.id === id || user.role === 'field') {
      const normalizedUserEmail = user.email?.toLowerCase().trim();
      const normalizedObraEmail = obra.usuarioAcceso?.toLowerCase().trim();
      
      return normalizedUserEmail === normalizedObraEmail || 
             obra.authorizedEmails?.some(e => e.email?.toLowerCase().trim() === normalizedUserEmail);
    }
    
    return false;
  }, [isUser, user, obra, isAdmin, id]);

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
          description: "Las credenciales no corresponden a este proyecto técnico.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de Sistema",
        description: "No se pudo validar el acceso. Reintente.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center px-4">Sincronizando Datos...</p>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-8 max-w-sm w-full border-none shadow-2xl rounded-[2.5rem] text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="font-black text-lg text-[#0a3d62] uppercase">No encontrado</h1>
          <p className="text-xs text-muted-foreground mt-2 mb-6 font-medium">El proyecto no existe o el link es incorrecto.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-12 bg-[#0a3d62] rounded-xl font-black">VOLVER AL PANEL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight">Acceso Técnico</h2>
            <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.2em] mt-1">Sincronizado Cloud Tamer</p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">PROYECTO:</p>
              <h3 className="font-black text-sm text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Usuario Autorizado</Label>
                <Input 
                  placeholder="ej. tecnico@tamer.com"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  className="h-12 rounded-xl font-bold bg-slate-50 border-none focus:bg-white transition-all shadow-sm" 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Clave</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-12 rounded-xl font-bold bg-slate-50 border-none pr-12 focus:bg-white transition-all shadow-sm" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-xl font-black text-base shadow-lg shadow-[#0a3d62]/10 gap-2 mt-4" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <>ACCEDER A PLANOS <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <div className="bg-[#0a3d62] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-5 py-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="text-[#0a3d62] w-6 h-6" />
              )}
            </div>
            <Button variant="ghost" onClick={logout} className="text-white border border-white/20 rounded-lg h-9 px-4 font-black text-[9px] tracking-widest bg-white/5 hover:bg-white/10 transition-all uppercase">
              <LogOut className="w-3.5 h-3.5 mr-2" /> SALIR
            </Button>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-black uppercase leading-tight tracking-tight text-white">
              {obra.nombreObra}
            </h1>
            
            <div className="flex flex-wrap gap-2">
              <div className="bg-primary text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-wider">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-wider border border-white/10">OT: {obra.numeroOT}</div>
              <div className="bg-white/10 text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-wider border border-white/10">ID: {obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cliente:</p>
              <p className="font-black text-[#0a3d62] text-base uppercase leading-tight">{obra.cliente}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ubicación:</p>
              <div className="flex items-start gap-2 font-bold text-[#0a3d62]">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm leading-snug">{obra.direccion || 'S/D'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> PLANOS Y DOCUMENTOS
            </h3>
            {obra.files && <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-1 rounded-md uppercase">{obra.files.length} ITEMS</span>}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((file, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 flex items-center justify-between gap-3 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0a3d62] text-xs sm:text-sm truncate uppercase tracking-tight">{file.name}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Sincronizado</p>
                    </div>
                  </div>
                  {file.id ? (
                    <Button asChild className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-md shrink-0 transition-transform active:scale-90">
                      <a href={`https://drive.google.com/uc?id=${file.id}&export=download`} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  ) : (
                    <div className="text-[8px] font-black text-muted-foreground/30 italic">N/A</div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="font-black text-[#0a3d62] uppercase tracking-widest text-[10px]">No hay archivos listados</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase">Sincronizando con Repositorio...</p>
              </div>
            )}

            {obra.driveFolderUrl && (
              <Button asChild className="w-full h-16 rounded-2xl bg-[#0a3d62] hover:bg-[#0a3d62]/90 font-black text-sm gap-4 shadow-xl mt-4 group">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  CARPETA COMPLETA DRIVE
                  <ChevronRight className="w-5 h-5 ml-auto text-primary" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] pt-8">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | CLOUD v3.6.8
        </p>
      </main>
    </div>
  );
}

export default function ObraViewPage() {
  return <Suspense fallback={<div className="p-8 text-center text-[10px] font-black uppercase tracking-widest">Cargando...</div>}><ObraViewContent /></Suspense>;
}
