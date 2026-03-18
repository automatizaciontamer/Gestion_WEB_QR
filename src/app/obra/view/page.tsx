
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
  ExternalLink
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a3d62]">Sincronizando Archivos...</p>
        </div>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <Card className="max-w-md w-full p-8 text-center rounded-[2rem] shadow-2xl border-none">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-lg font-black text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <p className="text-xs text-muted-foreground mt-2 mb-8 italic">El enlace QR no es válido o ha expirado.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl font-black bg-[#0a3d62]">VOLVER AL INICIO</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-black uppercase tracking-tight">Acceso Privado</h2>
            <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.3em] mt-2">Personal Autorizado</p>
          </div>
          <CardContent className="p-6">
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
              <span className="text-[9px] font-black text-[#0a3d62] uppercase tracking-widest opacity-60">PROYECTO</span>
              <h3 className="font-black text-sm text-[#0a3d62] uppercase mt-1 leading-tight">{obra.nombreObra}</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Email de Acceso</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/30 border-none font-bold text-sm px-4"
                  placeholder="Ej: obra@tamer.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Clave de Seguridad</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/30 border-none font-bold text-sm px-4 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-base gap-3 shadow-lg active:scale-95 transition-all mt-2"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> DESBLOQUEAR ARCHIVOS</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
      {/* Cabecera optimizada: Mayor altura para evitar solapamiento */}
      <div className="bg-[#0a3d62] text-white pt-10 pb-20 px-4 relative">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Construction className="w-10 h-10 text-[#0a3d62]" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight uppercase leading-tight">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h1>
            <p className="text-[8px] font-black opacity-50 tracking-[0.4em] uppercase">Gestión de Documentación v3.5.4</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full h-8 px-6 font-black text-[9px] uppercase tracking-widest mt-2">
            <LogOut className="w-4 h-4 mr-2" /> SALIR DEL SISTEMA
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6 -mt-10 relative z-10">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-gray-50/30">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                  <Construction className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#0a3d62] text-white border-none font-black text-[10px] px-3 py-1">OF: {obra.numeroOF}</Badge>
                  <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1">OT: {obra.numeroOT}</Badge>
                </div>
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-black text-[#0a3d62] uppercase leading-tight break-words">
                  {obra.nombreObra}
                </CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{obra.cliente}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Ubicación de Instalación</p>
                    <p className="font-bold text-[#0a3d62] text-sm leading-snug">{obra.direccion || 'No especificada'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Detalles del Proyecto</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{obra.descripcion || 'Sin descripción técnica registrada.'}</p>
                  </div>
                </div>
              </div>

              {obra.driveFolderUrl && (
                <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-dashed border-emerald-200 flex flex-col items-center gap-4 group transition-all hover:bg-emerald-100/50">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.2em] mb-1">Repositorio Completo de Planos</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Acceso Directo Google Drive</p>
                  </div>
                  <Button asChild className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-sm font-black gap-3 shadow-xl shadow-emerald-600/20">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-5 h-5" /> ABRIR CARPETA DE PLANOS
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Listado de archivos: Visualización directa */}
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" /> Archivos Sincronizados
            </h3>
            <span className="text-[10px] font-black text-muted-foreground bg-white px-3 py-1 rounded-full shadow-sm border">{obra.files?.length || 0} ITEMS</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-md border border-secondary flex items-center justify-between gap-4 transition-all hover:border-primary/40 hover:shadow-lg">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-inner">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="font-black text-[#0a3d62] text-xs truncate break-all">{fileName}</p>
                  </div>
                  {obra.driveFolderUrl && (
                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shrink-0">
                      <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer" title="Descargar de Drive">
                        <Download className="w-5 h-5" />
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-4 border-dashed rounded-[2.5rem] border-slate-200 bg-white/40 flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-slate-200" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">No hay planos específicos cargados</p>
                <p className="text-[9px] font-bold text-slate-400">Utilice el botón de carpeta superior si está disponible</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-12 text-center space-y-2">
          <div className="h-px w-20 bg-slate-200 mx-auto mb-4" />
          <p className="text-[9px] font-black text-[#0a3d62] opacity-40 uppercase tracking-[0.5em]">
            TAMER INDUSTRIAL S.A.
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sincronización Cloud Segura</p>
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
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Ingeniería...</p>
        </div>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
