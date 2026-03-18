
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
  Info,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  FolderOpen,
  ExternalLink,
  ChevronRight,
  FileDown
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
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a3d62]">Sincronizando Expediente Tamer...</p>
        </div>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <Card className="max-w-md w-full p-10 text-center rounded-[3rem] shadow-2xl border-none">
          <AlertCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
          <h1 className="text-xl font-black text-[#0a3d62] uppercase tracking-tighter">Proyecto No Encontrado</h1>
          <p className="text-sm text-muted-foreground mt-4 mb-8 font-medium">El código de obra no es válido o el registro ha sido removido del sistema.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 rounded-2xl font-black bg-[#0a3d62] shadow-xl">VOLVER AL PANEL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 sm:p-12 text-center text-white">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-3">Acceso Técnico</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Identidad Digital v3.5.6</p>
          </div>
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Validando Acceso Para:</span>
              <h3 className="font-black text-lg text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-4">Email o Usuario Autorizado</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg px-6"
                  placeholder="usuario@tamer.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-4">Clave de Seguridad</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg px-6 pr-14"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-6 h-6 text-[#0a3d62]" /> : <Eye className="w-6 h-6 text-[#0a3d62]" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-lg gap-4 shadow-2xl active:scale-95 transition-all mt-4"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-6 h-6 text-primary" /> VALIDAR IDENTIDAD</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32 overflow-x-hidden">
      {/* Cabecera Técnica Industrial */}
      <div className="bg-[#0a3d62] text-white pt-16 pb-40 px-6 relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center p-4 shadow-2xl">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Construction className="w-14 h-14 text-[#0a3d62]" />
            )}
          </div>
          
          <div className="space-y-6 max-w-full">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-[1.1] text-balance">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge className="bg-primary text-white border-none font-black text-[12px] px-6 py-2 rounded-xl shadow-lg">OF: {obra.numeroOF}</Badge>
              <Badge className="bg-white/10 text-white border-none font-black text-[12px] px-6 py-2 rounded-xl backdrop-blur-sm">OT: {obra.numeroOT}</Badge>
            </div>
            <p className="text-[10px] font-black opacity-40 tracking-[0.5em] uppercase pt-4">Expediente Técnico Tamer v3.5.6</p>
          </div>

          <Button variant="ghost" size="sm" onClick={logout} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-full h-12 px-10 font-black text-[11px] uppercase tracking-widest mt-4">
            <LogOut className="w-5 h-5 mr-3" /> CERRAR SESIÓN TÉCNICA
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 space-y-8 -mt-24 relative z-20">
        {/* Ficha de Información de Proyecto */}
        <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b bg-slate-50/50">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">TITULAR DEL PROYECTO</p>
              <h2 className="text-3xl font-black text-[#0a3d62] uppercase leading-tight">
                {obra.cliente}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-1 gap-10">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-primary/10 rounded-[1.5rem] shrink-0">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Ubicación de Obra</p>
                  <p className="font-bold text-[#0a3d62] text-lg leading-snug">{obra.direccion || 'No especificada'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="p-4 bg-primary/10 rounded-[1.5rem] shrink-0">
                  <Info className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Descripción Técnica</p>
                  <p className="text-base text-gray-600 leading-relaxed font-medium">{obra.descripcion || 'Sin detalles adicionales.'}</p>
                </div>
              </div>

              {/* Botón de Acceso a Google Drive - Siempre Principal */}
              {obra.driveFolderUrl && (
                <div className="pt-6">
                  <div className="bg-emerald-50 p-10 rounded-[3rem] border-4 border-dashed border-emerald-200 flex flex-col items-center gap-8 group transition-all hover:bg-emerald-100/50 hover:border-emerald-300">
                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <FolderOpen className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-black text-[#0a3d62] uppercase tracking-[0.2em]">Repositorio Oficial Drive</p>
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Sincronización de Planos en Tiempo Real</p>
                    </div>
                    <Button asChild className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 rounded-[2rem] text-lg font-black gap-4 shadow-2xl shadow-emerald-600/40 active:scale-95 transition-all">
                      <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-7 h-7" /> ABRIR CARPETA DE PLANOS
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Listado de Documentación Sincronizada */}
        <div className="space-y-6 px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-3">
              <FileDown className="w-6 h-6 text-primary" /> Planos y Documentos
            </h3>
            <Badge variant="secondary" className="font-black text-[10px] px-4 py-1.5 rounded-full uppercase bg-white shadow-sm">{obra.files?.length || 0} ARCHIVOS</Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <div key={idx} className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border-2 border-transparent flex items-center justify-between gap-6 transition-all hover:border-primary/20 group">
                  <div className="flex items-center gap-6 min-w-0">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="font-black text-[#0a3d62] text-sm sm:text-base truncate leading-tight">{fileName}</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-primary bg-slate-50 hover:bg-primary hover:text-white shrink-0 shadow-sm">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-7 h-7" />
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              obra.driveFolderUrl ? (
                <div className="p-16 text-center border-4 border-dashed rounded-[3.5rem] border-slate-200 bg-white/50 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Construction className="w-10 h-10 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-[#0a3d62] font-black uppercase tracking-widest text-[12px] mb-2">Acceso a Repositorio Activo</p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase max-w-[250px] mx-auto leading-relaxed">Usa el botón superior verde para acceder a la carpeta completa de planos en Google Drive.</p>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center border-4 border-dashed rounded-[3.5rem] border-slate-200 bg-white/50 flex flex-col items-center gap-4">
                  <AlertCircle className="w-12 h-12 text-slate-300" />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-[11px]">No hay documentación vinculada</p>
                </div>
              )
            )}
          </div>
        </div>

        <footer className="pt-20 text-center">
          <div className="h-1.5 w-20 bg-primary/20 mx-auto mb-8 rounded-full" />
          <p className="text-[11px] font-black text-[#0a3d62] opacity-40 uppercase tracking-[0.7em]">
            TAMER INDUSTRIAL S.A.
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 italic">Liderando en Ingeniería de Alta Seguridad</p>
        </footer>
      </div>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="animate-spin text-primary w-14 h-14" />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Validando Portal Técnico...</p>
        </div>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
