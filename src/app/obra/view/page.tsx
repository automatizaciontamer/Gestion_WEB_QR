
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
  LogOut,
  FolderOpen,
  ArrowRight
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
    
    const normalizedUserEmail = user.email?.toLowerCase().trim();
    const normalizedObraEmail = obra.usuarioAcceso?.toLowerCase().trim();
    
    // Verificación de campo o cliente autorizado
    return normalizedUserEmail === normalizedObraEmail || 
           obra.authorizedEmails?.some(e => e.email?.toLowerCase().trim() === normalizedUserEmail);
  }, [isUser, user, obra, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsLoggingIn(true);
    
    const success = await login(identifier, password, id);
    
    if (!success) {
      toast({
        variant: "destructive",
        title: "Acceso Denegado",
        description: "Credenciales incorrectas para este proyecto.",
      });
    }
    setIsLoggingIn(false);
  };

  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0a3d62]">Sincronizando con Tamer Cloud...</p>
        </div>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl border-none">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-xl font-black text-[#0a3d62]">PROYECTO NO ENCONTRADO</h1>
          <Button onClick={() => router.push('/login')} className="w-full h-14 rounded-2xl font-black bg-[#0a3d62] mt-8">VOLVER AL INICIO</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase">Acceso Técnico</h2>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-1">Tamer Industrial S.A.</p>
          </div>
          <CardContent className="p-8">
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Proyecto:</span>
              <h3 className="font-black text-sm text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Email Autorizado</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-14 rounded-xl bg-slate-100 border-none font-bold text-base px-5"
                  placeholder="usuario@tamer.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Clave de Seguridad</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-14 rounded-xl bg-slate-100 border-none font-bold text-base px-5 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5 text-[#0a3d62]" /> : <Eye className="w-5 h-5 text-[#0a3d62]" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-xl font-black text-base gap-3 shadow-xl mt-4"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : "VALIDAR ACCESO"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Encabezado Técnico Rediseñado v3.6.1 */}
      <header className="bg-[#0a3d62] text-white pt-12 pb-24 px-6 shadow-xl relative z-0">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="w-8 h-8 text-[#0a3d62]" />
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/10 rounded-full font-black text-[10px] tracking-widest h-9 px-5 border border-white/20">
              <LogOut className="w-4 h-4 mr-2" /> SALIR
            </Button>
          </div>
          
          <div className="space-y-4 pt-4">
            <h1 className="text-3xl sm:text-4xl font-black uppercase leading-[1.1] break-words drop-shadow-lg text-white">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-primary text-white font-black text-[11px] px-4 py-2 rounded-xl shadow-md border border-white/10 uppercase tracking-tighter">OF: {obra.numeroOF}</div>
              <div className="bg-white/20 text-white border border-white/20 font-black text-[11px] px-4 py-2 rounded-xl backdrop-blur-sm uppercase tracking-tighter">OT: {obra.numeroOT}</div>
              <div className="bg-white/20 text-white border border-white/20 font-black text-[11px] px-4 py-2 rounded-xl backdrop-blur-sm uppercase tracking-tighter">ID: {obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-12 space-y-8 relative z-10">
        {/* Ficha Informativa */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden border-t-4 border-primary">
          <CardContent className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Titular del Proyecto</p>
                <p className="font-black text-[#0a3d62] text-xl uppercase tracking-tight">{obra.cliente}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Dirección de Obra</p>
                <div className="flex items-start gap-3 text-[#0a3d62]">
                  <MapPin className="w-5 h-5 shrink-0 text-primary" />
                  <p className="font-bold text-base leading-snug">{obra.direccion || 'Ubicación no especificada'}</p>
                </div>
              </div>
            </div>
            {obra.descripcion && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Alcance Técnico</p>
                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">{obra.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección de Documentación */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" /> DOCUMENTACIÓN TÉCNICA
            </h3>
            {obra.files && (
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full">{obra.files.length} ARCHIVOS</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Lista de Archivos Específicos */}
            {obra.files && obra.files.length > 0 && obra.files.map((fileName, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between gap-4 group hover:border-primary/30 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#0a3d62] text-sm sm:text-base truncate uppercase tracking-tight">{fileName}</p>
                    <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">PLANO SINCRONIZADO CLOUD</p>
                  </div>
                </div>
                <Button asChild className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 text-white shrink-0 shadow-lg shadow-primary/20 transition-all">
                  <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-6 h-6" />
                  </a>
                </Button>
              </div>
            ))}

            {/* Acceso Directo a Repositorio */}
            {obra.driveFolderUrl && (
              <Button asChild className="w-full h-24 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 font-black text-xl gap-5 shadow-2xl shadow-[#0a3d62]/30 group transition-all active:scale-[0.97] mt-4">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <FolderOpen className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="uppercase leading-tight">REPOSITORIO DRIVE</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Acceso total a planos e ingeniería</p>
                  </div>
                  <ArrowRight className="w-8 h-8 ml-auto text-primary" />
                </a>
              </Button>
            )}

            {!obra.driveFolderUrl && (!obra.files || obra.files.length === 0) && (
              <div className="p-20 text-center border-4 border-dashed rounded-[3rem] border-slate-200 bg-white/50 flex flex-col items-center gap-6">
                <Construction className="w-16 h-16 text-slate-300" />
                <div className="space-y-2">
                  <p className="text-[#0a3d62] font-black uppercase tracking-[0.3em] text-sm">SIN DOCUMENTACIÓN</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase">El proyecto se encuentra en etapa de carga técnica.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-20 text-center opacity-30 pb-10">
        <p className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.6em]">TAMER INDUSTRIAL S.A. | v3.6.1</p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-primary w-14 h-14" />
          <p className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.5em]">CARGANDO ENTORNO TÉCNICO...</p>
        </div>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
