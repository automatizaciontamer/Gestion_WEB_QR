
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Sincronizando con Servidor Tamer v3.7.1...</p>
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
          <div className="bg-[#0a3d62] p-8 text-center text-white space-y-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/20 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Acceso a Obra</h2>
              <p className="text-[8px] font-bold opacity-60 uppercase tracking-[0.3em] mt-1">Ingeniería Tamer Industrial</p>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <p className="text-[8px] font-black uppercase text-primary tracking-widest mb-1">PROYECTO TÉCNICO:</p>
              <h3 className="font-black text-sm text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase ml-1 tracking-widest text-muted-foreground">ID de Usuario Autorizado</Label>
                <Input 
                  placeholder="usuario@tamer.com"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  className="h-12 rounded-xl font-bold bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all text-xs" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-12 rounded-xl font-bold bg-slate-50 border-none pr-12 focus:ring-2 focus:ring-primary/20 transition-all text-xs" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-sm shadow-xl shadow-[#0a3d62]/20 gap-3 mt-2 transition-all active:scale-95" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <>AUTENTICAR Y VER <ArrowRight className="w-4 h-4" /></>}
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
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera Técnica v3.7.1 */}
      <header className="bg-[#0a3d62] text-white pt-10 pb-16 px-6 shadow-2xl relative">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">SINC: ONLINE</p>
                <p className="text-[9px] font-black text-primary uppercase">v3.7.1</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={logout} 
              className="text-white border border-white/20 rounded-xl h-10 px-4 font-black text-[9px] tracking-widest bg-white/5 hover:bg-white/10 transition-all uppercase"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> SALIR
            </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-xl sm:text-3xl font-black uppercase leading-tight tracking-tight text-white">
              {obra.nombreObra}
            </h1>
            
            <div className="flex flex-wrap gap-2">
              <div className="bg-primary text-white font-black text-[9px] sm:text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-md">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white font-black text-[9px] sm:text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider border border-white/10">OT: {obra.numeroOT}</div>
              <div className="bg-white/10 text-white font-black text-[9px] sm:text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider border border-white/10">CLI: {obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-10 space-y-6 pb-20 relative z-10">
        {/* Ficha de Ubicación */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Entidad Solicitante:</p>
              <p className="font-black text-[#0a3d62] text-lg uppercase leading-tight truncate">{obra.cliente}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Localización:</p>
              <div className="flex items-start gap-2 font-bold text-[#0a3d62]">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">{obra.direccion || 'Consultar Oficina Técnica'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección de Documentos Directos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> DOCUMENTACIÓN TÉCNICA
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {hasFiles ? (
              files.map((file, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0a3d62] text-sm truncate uppercase">{file.name}</p>
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5">VINCULADO CLOUD</p>
                    </div>
                  </div>
                  {file.id && (
                    <Button asChild className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shrink-0">
                      <a href={`https://drive.google.com/uc?id=${file.id}&export=download`} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : null}

            {/* Acceso Principal a Carpeta (Prioritario si no hay archivos individuales) */}
            {hasFolderUrl && (
              <Button asChild className="w-full h-20 rounded-[2rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 font-black text-base gap-4 shadow-xl mt-2 group transition-all active:scale-95 border-t-4 border-primary">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="uppercase tracking-tight">ABRIR REPOSITORIO DE DRIVE</p>
                    <p className="text-[8px] opacity-60 font-black tracking-widest uppercase">Carpeta completa de Planos</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto opacity-40 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            )}

            {/* Si no hay NADA registrado en Firestore para esta obra */}
            {!hasFiles && !hasFolderUrl && (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200 shadow-inner">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h4 className="font-black text-[#0a3d62] uppercase tracking-[0.3em] text-[10px]">Repositorio en Sincronización</h4>
                <p className="text-[9px] text-muted-foreground font-black mt-2 uppercase tracking-widest leading-relaxed px-4">
                  No se han cargado planos específicos o el enlace de Drive aún no ha sido sincronizado.<br/>
                  Contacte con la oficina técnica central.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] pt-10">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | v3.7.1
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
