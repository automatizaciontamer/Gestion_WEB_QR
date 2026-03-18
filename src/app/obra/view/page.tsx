
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
  LogOut,
  ChevronRight
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Sincronizando con Servidor Tamer v3.7.0...</p>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-10 max-w-sm w-full border-none shadow-2xl rounded-[3rem] text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase tracking-tight">Proyecto No Encontrado</h1>
          <p className="text-xs text-muted-foreground mt-3 mb-8 font-bold leading-relaxed">El enlace que has seguido no existe o ha sido removido del sistema.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black">IR AL PANEL DE CONTROL</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 text-center text-white space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto border border-white/20 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Acceso a Obra</h2>
              <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.3em] mt-1">Ingeniería Tamer Industrial</p>
            </div>
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-2">PROYECTO TÉCNICO:</p>
              <h3 className="font-black text-base text-[#0a3d62] uppercase leading-snug">{obra.nombreObra}</h3>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">ID de Usuario Autorizado</Label>
                <Input 
                  placeholder="Ej. instalador@tamer.com"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  className="h-14 rounded-2xl font-bold bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Contraseña de Acceso</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-14 rounded-2xl font-bold bg-slate-50 border-none pr-14 focus:ring-2 focus:ring-primary/20 transition-all text-sm" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-base shadow-xl shadow-[#0a3d62]/20 gap-3 mt-4 transition-all active:scale-95" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <>AUTENTICAR Y VER PLANOS <ArrowRight className="w-5 h-5" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera Técnica sin solapamientos v3.7.0 */}
      <header className="bg-[#0a3d62] text-white pt-12 pb-16 px-6 shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl border-4 border-white/5">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-7 h-7" />
                )}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">PERSONAL AUTORIZADO</p>
                <p className="text-xs font-black truncate max-w-[150px] uppercase text-primary">SINC: ONLINE</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={logout} 
              className="text-white border border-white/20 rounded-xl h-12 px-6 font-black text-[10px] tracking-widest bg-white/5 hover:bg-white/10 transition-all uppercase"
            >
              <LogOut className="w-4 h-4 mr-2" /> SALIR
            </Button>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-2xl sm:text-4xl font-black uppercase leading-[1.1] tracking-tight text-white drop-shadow-md">
              {obra.nombreObra}
            </h1>
            
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <div className="bg-primary text-white font-black text-[10px] sm:text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-lg">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white font-black text-[10px] sm:text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider border border-white/10 backdrop-blur-md">OT: {obra.numeroOT}</div>
              <div className="bg-white/10 text-white font-black text-[10px] sm:text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider border border-white/10 backdrop-blur-md">CLIENTE: {obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-8 space-y-8 pb-24">
        {/* Ficha de Ubicación */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Entidad Solicitante:</p>
              <p className="font-black text-[#0a3d62] text-xl uppercase leading-tight">{obra.cliente}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Localización de Obra:</p>
              <div className="flex items-start gap-3 font-bold text-[#0a3d62]">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <span className="text-sm leading-relaxed">{obra.direccion || 'Ubicación no declarada en ficha técnica'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección de Documentos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.5em] flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" /> DOCUMENTACIÓN TÉCNICA
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((file, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 flex items-center justify-between gap-4 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shrink-0 border border-slate-100 shadow-sm">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0a3d62] text-base sm:text-lg truncate uppercase tracking-tight">{file.name}</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Sincronizado Cloud</p>
                    </div>
                  </div>
                  {file.id ? (
                    <Button asChild className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shrink-0 transition-transform active:scale-90">
                      <a href={`https://drive.google.com/uc?id=${file.id}&export=download`} target="_blank" rel="noopener noreferrer">
                        <Download className="w-6 h-6" />
                      </a>
                    </Button>
                  ) : (
                    <div className="bg-slate-100 p-4 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
              ))
            ) : null}

            {/* Acceso Principal a Google Drive (Siempre visible si existe link) */}
            {obra.driveFolderUrl && (
              <Button asChild className="w-full h-24 rounded-[3rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 font-black text-lg sm:text-xl gap-6 shadow-2xl mt-4 group border-t-[6px] border-primary transition-all active:scale-95">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="uppercase tracking-tight">Acceder a Repositorio Completo</p>
                    <p className="text-[10px] opacity-60 font-black tracking-widest uppercase">Carpeta de Planos en Google Drive</p>
                  </div>
                  <ChevronRight className="w-6 h-6 ml-auto opacity-40 group-hover:translate-x-2 transition-transform" />
                </a>
              </Button>
            )}

            {/* Caso sin archivos ni link */}
            {(!obra.files || obra.files.length === 0) && !obra.driveFolderUrl && (
              <div className="bg-white p-20 rounded-[3.5rem] text-center border-4 border-dashed border-slate-100 shadow-inner">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h4 className="font-black text-[#0a3d62] uppercase tracking-[0.4em] text-sm">Repositorio Vacío</h4>
                <p className="text-[10px] text-muted-foreground font-black mt-3 uppercase tracking-widest leading-relaxed">
                  No se han cargado planos específicos para esta obra.<br/>
                  Contacte con la oficina técnica central.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] pt-16">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | CLOUD INFRASTRUCTURE v3.7.0
        </p>
      </main>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-black uppercase tracking-[0.4em] text-[10px] text-muted-foreground">Iniciando Portal de Seguridad...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
