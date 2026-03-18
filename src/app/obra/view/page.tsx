
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
  User as UserIcon, 
  Info,
  Loader2,
  AlertCircle,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();
  const { isUser, user, isAdmin, login, logout, empresa } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading, error } = useDoc<Obra>(obraDocRef);

  // Validación de autorización estricta v3.3.7
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    
    // 1. Administradores: Acceso Total
    if (isAdmin) return true;

    // 2. Usuarios de Campo (Field): Solo acceden si su sesión está vinculada EXACTAMENTE a esta obra
    if (user.role === 'field') {
      return user.id === id;
    }

    // 3. Clientes Registrados (User): Acceden si su email está en la lista de autorizados de este proyecto
    if (user.role === 'user') {
      const userEmail = user.email?.toLowerCase().trim();
      const isMainEmail = obra.usuarioAcceso?.toLowerCase().trim() === userEmail;
      const isInAuthorizedList = obra.authorizedEmails?.some(e => e.email?.toLowerCase().trim() === userEmail);
      return isMainEmail || isInAuthorizedList;
    }

    return false;
  }, [isUser, user, obra, isAdmin, id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsLoggingIn(true);
    
    // Login restringido estrictamente al ID de esta obra v3.3.7
    const success = await login(identifier, password, id);
    
    if (!success) {
      toast({
        variant: "destructive",
        title: "Credenciales Incorrectas",
        description: "El usuario o clave no corresponden a esta obra específica.",
      });
    } else {
      toast({
        title: "Acceso Concedido",
        description: "Documentación técnica desbloqueada.",
      });
    }
    setIsLoggingIn(false);
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl border-none">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Enlace Erróneo</h1>
          <p className="text-muted-foreground mb-6">El código QR escaneado no contiene una referencia válida de obra.</p>
          <Button onClick={() => router.push('/login')} className="rounded-xl w-full h-12 font-black">VOLVER AL INICIO</Button>
        </Card>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3d62]">Validando Identidad Tamer Cloud v3.3.7...</p>
      </div>
    </div>
  );

  if (!obra || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl border-none">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Obra no Encontrada</h1>
          <p className="text-muted-foreground mb-6">Este proyecto no existe o ha sido retirado del sistema.</p>
          <Button onClick={() => router.push('/login')} className="rounded-xl w-full h-12 font-black">REGRESAR</Button>
        </Card>
      </div>
    );
  }

  // Interfaz de Login Específico por Obra
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-[0_35px_60px_-15px_rgba(10,61,98,0.3)] rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-12 text-center text-white">
            <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Acceso Técnico QR</h2>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Validación de Obra v3.3.7</p>
          </div>
          <CardContent className="p-10">
            <div className="mb-10 p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 text-center">
              <p className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.2em] mb-1">PROYECTO SELECCIONADO</p>
              <h3 className="font-black text-2xl text-[#0a3d62] leading-none uppercase truncate">{obra.nombreObra}</h3>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Badge className="bg-[#0a3d62] text-white border-none text-[10px] font-black px-3 py-1">OF: {obra.numeroOF}</Badge>
              </div>
            </div>

            {isUser && (
              <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] text-amber-800 font-black uppercase leading-tight mb-2">Su sesión actual no pertenece a esta obra.</p>
                  <Button variant="outline" size="sm" onClick={logout} className="h-8 rounded-xl text-[9px] font-black border-amber-300 text-amber-900 uppercase bg-white hover:bg-amber-100">Cerrar sesión e ingresar</Button>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-3 tracking-widest">Email de Obra</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-16 rounded-[1.5rem] bg-secondary/30 border-none font-black text-lg px-6"
                  placeholder="obra@tamer.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-3 tracking-widest">Contraseña Técnica</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-16 rounded-[1.5rem] bg-secondary/30 border-none font-black text-lg px-6 pr-14"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5 text-primary" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-18 py-8 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-[2rem] font-black text-xl gap-4 shadow-xl shadow-[#0a3d62]/20 active:scale-95 transition-all group"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin w-6 h-6" /> : <><ShieldCheck className="w-7 h-7" /> INGRESAR A OBRA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
            </form>
          </CardContent>
          <div className="px-10 pb-10 text-center">
            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] leading-relaxed">
              TAMER INDUSTRIAL S.A. | SEGURIDAD TÉCNICA CLOUD
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Interfaz Técnica Autorizada (v3.3.7)
  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-body">
      <div className="bg-[#0a3d62] text-white pt-20 pb-32 px-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center p-4 shadow-2xl">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="w-12 h-12 text-[#0a3d62]" />
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-none">{empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}</h1>
              <p className="text-[11px] font-black opacity-40 tracking-[0.4em] uppercase mt-3">Documentación Técnica v3.3.7</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex flex-col items-end bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
               <span className="text-[10px] font-black uppercase opacity-60 mb-1">Orden de Fabricación</span>
               <span className="text-2xl font-black font-mono tracking-tighter">{obra.numeroOF}</span>
            </div>
            <Button variant="ghost" onClick={logout} className="text-white/50 hover:text-white hover:bg-white/10 font-black text-[10px] tracking-[0.2em] uppercase">
              <LogOut className="w-4 h-4 mr-3" /> Finalizar Sesión Técnica
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 -mt-20 space-y-12 relative z-20">
        <Card className="border-none shadow-[0_40px_80px_-20px_rgba(10,61,98,0.2)] rounded-[3.5rem] bg-white overflow-hidden">
          <CardHeader className="p-12 border-b bg-gray-50/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-6 bg-primary/10 rounded-[2.5rem] shadow-inner">
                <Construction className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center md:text-left flex-1">
                <CardTitle className="text-4xl font-black text-[#0a3d62] uppercase tracking-tighter leading-none mb-3">{obra.nombreObra}</CardTitle>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 py-1.5 rounded-full text-[10px]">CLIENTE: {obra.cliente}</Badge>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 py-1.5 rounded-full text-[10px]">OT: {obra.numeroOT}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <MapPin className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Ubicación de Obra</p>
                    <p className="font-black text-xl text-[#0a3d62]">{obra.direccion || 'No especificada'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <Info className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Descripción del Proyecto</p>
                    <p className="font-bold text-gray-700 leading-relaxed italic text-sm">
                      {obra.descripcion || 'Sin descripción técnica detallada.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACCESO A GOOGLE DRIVE v3.3.7 */}
              <div className="bg-[#f8fafc] p-8 rounded-[3rem] border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center">
                {obra.driveFolderUrl ? (
                  <>
                    <FolderOpen className="w-12 h-12 text-emerald-600 mb-4" />
                    <h4 className="font-black text-[#0a3d62] text-lg uppercase leading-tight mb-4">Carpeta de Planos y Documentación</h4>
                    <Button 
                      asChild
                      className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 rounded-[1.5rem] text-lg font-black gap-3 shadow-xl shadow-emerald-600/20"
                    >
                      <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                        ABRIR EN DRIVE <ArrowRight className="w-5 h-5" />
                      </a>
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-3 opacity-40">
                    <FolderOpen className="w-12 h-12 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin enlace a Drive configurado</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div className="px-8">
            <h3 className="text-sm font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-4">
              <FileText className="w-6 h-6 text-primary" /> Archivos Individuales Sincronizados
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white group rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-[#0a3d62] group-hover:text-white transition-all shadow-inner">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-black text-[#0a3d62] text-xl truncate max-w-[200px] sm:max-w-md">
                          {fileName}
                        </p>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sincronizado vía Cloud</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="icon" className="w-14 h-14 rounded-[1.2rem] border-2 border-slate-100 hover:bg-slate-50" onClick={() => setSelectedFile(fileName)}>
                        <Eye className="w-6 h-6 text-[#0a3d62]" />
                      </Button>
                      <Button variant="outline" size="icon" className="w-14 h-14 rounded-[1.2rem] border-2 border-slate-100 hover:bg-slate-50">
                        <Download className="w-6 h-6 text-[#0a3d62]" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-24 text-center border-4 border-dashed rounded-[4rem] border-slate-200 bg-white/50">
                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[11px]">No hay archivos técnicos cargados individualmente.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-16 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">
          © {new Date().getFullYear()} {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'} | INGENIERÍA Y CALIDAD v3.3.7
        </footer>
      </div>

      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 rounded-[3rem] overflow-hidden border-none shadow-2xl">
          <div className="bg-[#0a3d62] text-white p-8 font-black uppercase tracking-tight flex justify-between items-center">
            <span className="text-xl">VISOR TÉCNICO: {selectedFile}</span>
          </div>
          <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center space-y-8">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <p className="text-lg font-black uppercase tracking-widest text-[#0a3d62]">Conectando con Servidor de Planos...</p>
            <Button className="rounded-[1.5rem] h-16 px-12 font-black uppercase tracking-widest text-lg bg-[#0a3d62] shadow-xl">Visualizar en Pantalla Completa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="p-24 text-center font-black uppercase text-[11px] tracking-[0.5em]">Conectando con Identidad Cloud Tamer v3.3.7...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
