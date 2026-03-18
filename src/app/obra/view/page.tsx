
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
  Info,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  FolderOpen,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    
    if (user.role === 'field') {
      return user.id === id || normalizedUserEmail === normalizedObraEmail;
    }

    return normalizedUserEmail === normalizedObraEmail || 
           obra.authorizedEmails?.some(e => e.email?.toLowerCase().trim() === normalizedUserEmail);
  }, [isUser, user, obra, isAdmin, id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsLoggingIn(true);
    
    const success = await login(identifier, password, id);
    
    if (!success) {
      toast({
        variant: "destructive",
        title: "Credenciales Incorrectas",
        description: "El usuario o clave no corresponden a esta obra.",
      });
    }
    setIsLoggingIn(false);
  };

  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a3d62]">Conectando con Cloud Tamer...</p>
        </div>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <Card className="max-w-md w-full p-8 text-center rounded-[2rem] shadow-2xl border-none">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-lg font-black text-[#0a3d62] uppercase">Acceso no válido</h1>
          <p className="text-xs text-muted-foreground mt-2 mb-8 italic">El proyecto solicitado no existe en el sistema.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl font-black bg-[#0a3d62]">IR AL PANEL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 text-center text-white">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase tracking-tight">Portal de Obra</h2>
            <p className="text-[9px] font-black opacity-50 uppercase tracking-[0.3em] mt-2">Validación de Seguridad</p>
          </div>
          <CardContent className="p-8">
            <div className="mb-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 text-center">
              <span className="text-[10px] font-black text-[#0a3d62] opacity-40 uppercase tracking-widest">PROYECTO SELECCIONADO</span>
              <h3 className="font-black text-lg text-[#0a3d62] uppercase mt-2 leading-tight">{obra.nombreObra}</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-3">Email Autorizado</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-base px-5"
                  placeholder="usuario@tamer.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-3">Clave de Acceso</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-base px-5 pr-14"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-lg gap-4 shadow-xl active:scale-95 transition-all mt-4"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-6 h-6 text-primary" /> ACCEDER A PLANOS</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 overflow-x-hidden">
      {/* Cabecera Técnica Expandida: Título completo y datos de OF/OT */}
      <div className="bg-[#0a3d62] text-white pt-12 pb-32 px-6 relative">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center p-3 shadow-2xl">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Construction className="w-12 h-12 text-[#0a3d62]" />
            )}
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase leading-tight">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge className="bg-primary text-white border-none font-black text-[11px] px-4 py-1.5 rounded-lg shadow-lg">OF: {obra.numeroOF}</Badge>
              <Badge className="bg-white/10 text-white border-none font-black text-[11px] px-4 py-1.5 rounded-lg">OT: {obra.numeroOT}</Badge>
            </div>
            <p className="text-[9px] font-black opacity-40 tracking-[0.4em] uppercase pt-2">Expediente Técnico Tamer v3.5.5</p>
          </div>

          <Button variant="ghost" size="sm" onClick={logout} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full h-10 px-8 font-black text-[10px] uppercase tracking-widest">
            <LogOut className="w-4 h-4 mr-2" /> FINALIZAR SESIÓN
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 space-y-8 -mt-16 relative z-10">
        {/* Ficha Informativa de la Obra */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-gray-50/50">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">RAZÓN SOCIAL CLIENTE</p>
              <h2 className="text-2xl font-black text-[#0a3d62] uppercase leading-tight">
                {obra.cliente}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Dirección de Instalación</p>
                  <p className="font-bold text-[#0a3d62] text-base leading-snug">{obra.direccion || 'Ubicación no registrada'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-5">
                <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Detalles y Alcance</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{obra.descripcion || 'Sin descripción técnica adicional.'}</p>
                </div>
              </div>

              {/* Acceso a Google Drive: El botón más importante si no hay archivos listados */}
              {obra.driveFolderUrl && (
                <div className="pt-4">
                  <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-4 border-dashed border-emerald-200 flex flex-col items-center gap-6 group transition-all hover:bg-emerald-100/50">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <FolderOpen className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.2em]">Repositorio Google Drive</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sincronización de Planos en Tiempo Real</p>
                    </div>
                    <Button asChild className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-base font-black gap-4 shadow-2xl shadow-emerald-600/30">
                      <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-6 h-6" /> ABRIR CARPETA DE PLANOS
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Listado de Archivos Específicos (si se cargaron vía App) */}
        <div className="space-y-5 px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" /> Documentación de Obra
            </h3>
            <Badge variant="secondary" className="font-black text-[9px] px-3 py-1 rounded-full uppercase">{obra.files?.length || 0} ARCHIVOS</Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[1.5rem] shadow-lg border border-transparent flex items-center justify-between gap-4 transition-all hover:border-primary/30 group">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-black text-[#0a3d62] text-sm truncate leading-tight">{fileName}</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-primary bg-slate-50 hover:bg-primary hover:text-white shrink-0">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-6 h-6" />
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              !obra.driveFolderUrl && (
                <div className="p-16 text-center border-4 border-dashed rounded-[3rem] border-slate-200 bg-white/50 flex flex-col items-center gap-4">
                  <AlertCircle className="w-12 h-12 text-slate-300" />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-[11px]">No hay planos específicos sincronizados</p>
                </div>
              )
            )}
          </div>
        </div>

        <footer className="pt-16 text-center">
          <div className="h-1 w-16 bg-[#0a3d62]/10 mx-auto mb-6 rounded-full" />
          <p className="text-[10px] font-black text-[#0a3d62] opacity-30 uppercase tracking-[0.6em]">
            TAMER INDUSTRIAL S.A.
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Ingeniería e Instalaciones Seguras</p>
        </footer>
      </div>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accediendo a Planos...</p>
        </div>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
