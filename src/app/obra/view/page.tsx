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

  // Validación de acceso robusta v3.6.8
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    if (isAdmin) return true;
    
    // Si el usuario ya está logueado para esta obra específica
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Archivos...</p>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-10 max-w-sm w-full border-none shadow-2xl rounded-[2.5rem] text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive" />
          <h1 className="font-black text-xl text-[#0a3d62]">PROYECTO NO ENCONTRADO</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-8 font-medium">El enlace es inválido o la obra fue removida.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black">VOLVER AL PANEL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Validación Técnica</h2>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em] mt-1">Acceso Exclusivo Personal de Obra</p>
          </div>
          <CardContent className="p-10 space-y-8">
            <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">PROYECTO IDENTIFICADO:</p>
              <h3 className="font-black text-lg text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Usuario Autorizado</Label>
                <Input 
                  placeholder="ej. tecnico@tamer.com"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  className="h-14 rounded-2xl font-bold bg-slate-50 border-none focus:bg-white transition-all shadow-sm" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Clave de Acceso</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-14 rounded-2xl font-bold bg-slate-50 border-none pr-12 focus:bg-white transition-all shadow-sm" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-lg shadow-xl shadow-[#0a3d62]/20 gap-3" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <>ACCEDER A PLANOS <ArrowRight className="w-5 h-5" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Cabecera Corregida v3.6.9 - Estructura limpia y sin solapamientos */}
      <div className="bg-[#0a3d62] text-white overflow-hidden shadow-2xl">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="text-[#0a3d62] w-8 h-8" />
              )}
            </div>
            <Button variant="ghost" onClick={logout} className="text-white border border-white/20 rounded-xl h-10 px-5 font-black text-[10px] tracking-widest bg-white/5 hover:bg-white/10 transition-all uppercase">
              <LogOut className="w-4 h-4 mr-2" /> CERRAR SESIÓN
            </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black uppercase leading-[1.1] tracking-tight text-white drop-shadow-md">
              {obra.nombreObra}
            </h1>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider shadow-lg">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider border border-white/10 backdrop-blur-md">OT: {obra.numeroOT}</div>
              <div className="bg-white/10 text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider border border-white/10 backdrop-blur-md">ID: {obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-8 space-y-8 relative z-10">
        {/* Ficha de Obra */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Cliente / Solicitante:</p>
              <p className="font-black text-[#0a3d62] text-xl uppercase leading-tight">{obra.cliente}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Ubicación de Proyecto:</p>
              <div className="flex items-start gap-3 font-bold text-[#0a3d62]">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-base leading-snug">{obra.direccion || 'No especificada'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Listado de Documentos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" /> REPOSITORIO TÉCNICO
            </h3>
            {obra.files && <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">{obra.files.length} ARCHIVOS</span>}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((file, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between gap-4 group hover:border-primary/30 transition-all hover:translate-y-[-2px]">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0a3d62] text-sm sm:text-base truncate uppercase tracking-tight">{file.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Plano de Ingeniería Sincronizado</p>
                    </div>
                  </div>
                  {file.id ? (
                    <Button asChild className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 shrink-0 transition-transform active:scale-90">
                      <a href={`https://drive.google.com/uc?id=${file.id}&export=download`} target="_blank" rel="noopener noreferrer">
                        <Download className="w-6 h-6" />
                      </a>
                    </Button>
                  ) : (
                    <div className="text-[10px] font-black text-muted-foreground/40 italic px-4">SIN LINK</div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="font-black text-[#0a3d62] uppercase tracking-widest text-sm">Sin archivos individuales</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Sincronizando con Drive...</p>
              </div>
            )}

            {obra.driveFolderUrl && (
              <Button asChild className="w-full h-24 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 font-black text-xl gap-6 shadow-2xl mt-6 transition-all active:scale-[0.98] group">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-primary/20 transition-colors">
                    <FolderOpen className="w-7 h-7 text-primary" />
                  </div>
                  CARPETA COMPLETA DRIVE
                  <ChevronRight className="w-8 h-8 ml-auto text-primary" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] pt-10">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | SISTEMA CLOUD v3.6.9
        </p>
      </main>
    </div>
  );
}

export default function ObraViewPage() {
  return <Suspense><ObraViewContent /></Suspense>;
}
