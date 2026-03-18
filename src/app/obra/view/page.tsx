
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
  ChevronRight,
  Info
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

  // Validación de autorización robusta v4.0.0
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    if (isAdmin) return true;
    
    const sessionEmail = (user.email || '').toLowerCase().trim();
    const obraMainUser = (obra.usuarioAcceso || '').toLowerCase().trim();
    
    const hasAuthorizedEmail = (obra.authorizedEmails || []).some(
      e => (e.email || '').toLowerCase().trim() === sessionEmail
    );
    
    return sessionEmail === obraMainUser || hasAuthorizedEmail;
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
        description: "No se pudo validar el acceso técnico.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando con Tamer Cloud v4.0...</p>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-10 max-w-sm w-full border-none shadow-2xl rounded-[3rem] text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8">VOLVER AL PANEL</Button>
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
            <h2 className="text-xl font-black uppercase tracking-tight">Acceso Técnico Restringido</h2>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl text-center border">
              <p className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">PROYECTO:</p>
              <h3 className="font-black text-lg text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                placeholder="Usuario Autorizado"
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                className="h-14 rounded-2xl font-bold bg-slate-50 border-none shadow-inner" 
                required 
              />
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Clave de Acceso"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="h-14 rounded-2xl font-bold bg-slate-50 border-none shadow-inner" 
                  required 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
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

  const getDownloadUrl = (file: any) => {
    if (!file) return '#';
    const id = typeof file === 'string' ? file : file.id;
    if (id?.startsWith('http')) return id;
    return `https://drive.google.com/uc?id=${id}&export=download`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Limpio v4.0.0 - Sin solapamientos */}
      <header className="bg-[#0a3d62] text-white p-6 sm:p-12 space-y-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shrink-0">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Tamer Cloud v4.0</p>
                <h2 className="text-[9px] font-bold text-white/50 uppercase">{empresa?.nombre || 'Tamer Industrial S.A.'}</h2>
              </div>
            </div>
            <Button variant="ghost" onClick={logout} className="text-white border border-white/20 rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" /> SALIR
            </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight text-white">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-primary text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase shadow-lg shadow-primary/20">OF: {obra.numeroOF}</span>
              <span className="bg-white/10 text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase border border-white/10">OT: {obra.numeroOT}</span>
              <span className="bg-white/10 text-white font-black text-[10px] px-4 py-2 rounded-xl uppercase border border-white/10">CLIENTE: {obra.codigoCliente}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal - Sin márgenes negativos */}
      <main className="max-w-4xl mx-auto w-full px-6 py-10 space-y-10 flex-1">
        
        {/* Información del Proyecto */}
        <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100">
              <div className="flex items-center gap-3 mb-2 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Cliente Final:</p>
              </div>
              <p className="font-black text-[#0a3d62] text-xl uppercase leading-tight">{obra.cliente}</p>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2 text-primary">
                <MapPin className="w-4 h-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ubicación Técnica:</p>
              </div>
              <p className="font-bold text-[#0a3d62] text-sm leading-tight uppercase">
                {obra.direccion || 'Consultar Dirección en Oficina Central'}
              </p>
            </div>
          </div>
        </section>

        {/* Documentación Sincronizada */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.5em] flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" /> DOCUMENTACIÓN TÉCNICA
            </h3>
            {hasFiles && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full">{files.length} ARCHIVOS</span>}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {hasFiles ? files.map((file, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 flex items-center justify-between gap-4 transition-all hover:translate-x-1">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shrink-0 border border-slate-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#0a3d62] text-lg truncate uppercase leading-none">{file.name || `Plano ${idx + 1}`}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sincronizado Cloud</p>
                    </div>
                  </div>
                </div>
                <Button asChild className="h-14 w-14 rounded-2xl bg-[#0a3d62] hover:bg-primary shadow-xl shrink-0 transition-colors">
                  <a href={getDownloadUrl(file)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-6 h-6" />
                  </a>
                </Button>
              </div>
            )) : !hasFolderUrl && (
              <div className="bg-white p-16 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                <AlertCircle className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <h4 className="font-black text-[#0a3d62] uppercase text-xs tracking-widest">Sin Planos Específicos</h4>
                <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase max-w-[250px] mx-auto">Sincronización v4.0 en curso. Consulte el repositorio general.</p>
              </div>
            )}

            {hasFolderUrl && (
              <Button asChild className="w-full h-28 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/95 font-black text-lg gap-6 shadow-2xl mt-4 border-l-8 border-primary group relative overflow-hidden transition-all active:scale-95">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                  <FolderOpen className="w-10 h-10 text-primary z-10" />
                  <div className="text-left flex-1 z-10">
                    <p className="uppercase tracking-tight leading-none text-white text-2xl">REPOSITORIO GENERAL DRIVE</p>
                    <p className="text-[10px] opacity-60 font-black tracking-widest uppercase mt-2">Acceso a Carpeta Completa de Planos</p>
                  </div>
                  <ChevronRight className="w-8 h-8 opacity-40 group-hover:translate-x-2 transition-transform z-10" />
                  <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-20deg] translate-x-16"></div>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Sección de Ayuda */}
        <section className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-4">
          <Info className="w-6 h-6 text-blue-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-black text-blue-800 uppercase tracking-widest">Soporte Técnico</p>
            <p className="text-[10px] font-bold text-blue-700/70 leading-relaxed uppercase">
              Si detecta inconsistencias en la documentación o no puede visualizar un plano, contacte inmediatamente con la oficina técnica mencionando la OF: {obra.numeroOF}.
            </p>
          </div>
        </section>
      </main>

      <footer className="p-10 text-center bg-white border-t mt-auto">
        <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | GESTIÓN CLOUD v4.0
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-black uppercase text-[10px] tracking-widest">Iniciando Visor Técnico v4.0...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
