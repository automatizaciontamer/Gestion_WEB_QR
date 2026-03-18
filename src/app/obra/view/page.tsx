
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
        title: "Acceso Denegado",
        description: "El usuario o clave son incorrectos para esta obra.",
      });
    }
    setIsLoggingIn(false);
  };

  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a3d62]">Conectando con Tamer Cloud...</p>
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
          <Button onClick={() => router.push('/login')} className="w-full h-14 rounded-2xl font-black bg-[#0a3d62] shadow-xl mt-8">VOLVER AL PANEL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Acceso Técnico</h2>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Identidad Digital v3.5.7</p>
          </div>
          <CardContent className="p-8">
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Validando Proyecto:</span>
              <h3 className="font-black text-base text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Email o Usuario</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-14 rounded-xl bg-secondary/30 border-none font-bold text-base px-5"
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
                    className="h-14 rounded-xl bg-secondary/30 border-none font-bold text-base px-5 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5 text-[#0a3d62]" /> : <Eye className="w-5 h-5 text-[#0a3d62]" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-xl font-black text-base gap-3 shadow-xl mt-4"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> VALIDAR ACCESO</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32 overflow-x-hidden">
      {/* Cabecera Técnica Industrial - v3.5.7 Corregida */}
      <div className="bg-[#0a3d62] text-white pt-10 pb-44 px-6 relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-2xl">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Construction className="w-10 h-10 text-[#0a3d62]" />
            )}
          </div>
          
          <div className="space-y-4 max-w-full">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase leading-tight text-balance">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="bg-primary text-white border-none font-black text-[10px] px-4 py-1.5 rounded-lg shadow-md">OF: {obra.numeroOF}</Badge>
              <Badge className="bg-white/10 text-white border-none font-black text-[10px] px-4 py-1.5 rounded-lg backdrop-blur-sm">OT: {obra.numeroOT}</Badge>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={logout} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-full h-10 px-6 font-black text-[10px] uppercase tracking-widest mt-2">
            <LogOut className="w-4 h-4 mr-2" /> CERRAR SESIÓN
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6 -mt-32 relative z-20">
        {/* Información del Proyecto */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-slate-50/50">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">TITULAR DEL PROYECTO</p>
              <h2 className="text-xl font-black text-[#0a3d62] uppercase leading-tight">
                {obra.cliente}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Ubicación de Obra</p>
                  <p className="font-bold text-[#0a3d62] text-sm leading-snug">{obra.direccion || 'No especificada'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Detalles Técnicos</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{obra.descripcion || 'Sin detalles adicionales.'}</p>
                </div>
              </div>

              {/* Acceso Principal a Carpeta Drive */}
              {obra.driveFolderUrl && (
                <div className="pt-4">
                  <Button asChild className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-base font-black gap-3 shadow-xl shadow-emerald-600/30 transition-all active:scale-95">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <FolderOpen className="w-6 h-6" /> ABRIR CARPETA DE PLANOS
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Listado de Documentos Sincronizados */}
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-2">
              <FileDown className="w-5 h-5 text-primary" /> Documentación Técnica
            </h3>
            <Badge variant="secondary" className="font-black text-[9px] px-3 py-1 rounded-full uppercase bg-white shadow-sm border-none">{obra.files?.length || 0} ARCHIVOS</Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-inner">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-[#0a3d62] text-sm truncate leading-tight">{fileName}</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary bg-slate-50 hover:bg-primary hover:text-white shrink-0">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed rounded-[2rem] border-slate-200 bg-white/50 flex flex-col items-center gap-4">
                <Construction className="w-10 h-10 text-slate-300" />
                <div>
                  <p className="text-[#0a3d62] font-black uppercase tracking-widest text-[10px] mb-1">Acceso a Repositorio Activo</p>
                  <p className="text-muted-foreground text-[9px] font-bold uppercase max-w-[200px] mx-auto leading-relaxed">Usa el botón superior para acceder a la carpeta de planos en Google Drive.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-16 text-center">
          <div className="h-1 w-12 bg-primary/20 mx-auto mb-6 rounded-full" />
          <p className="text-[10px] font-black text-[#0a3d62] opacity-30 uppercase tracking-[0.5em]">
            TAMER INDUSTRIAL S.A.
          </p>
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Iniciando Portal Técnico...</p>
        </div>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
