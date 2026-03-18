
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
  User as UserIcon, 
  Info,
  Loader2,
  AlertCircle,
  ExternalLink,
  Eye,
  Lock,
  ShieldCheck,
  EyeOff,
  LogOut
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
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
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

  // Validación de autorización estricta v3.3.3
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    
    // 1. Administradores: Acceso Total
    if (isAdmin) return true;

    // 2. Usuarios de Campo (Field): Solo acceden si el ID de la sesión coincide con la Obra
    if (user.role === 'field') {
      return user.id === id;
    }

    // 3. Usuarios Clientes (User): Acceden si su email está autorizado para esta obra específica
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
    setIsLoggingIn(true);
    
    const success = await login(identifier, password);
    
    if (!success) {
      toast({
        variant: "destructive",
        title: "Credenciales Inválidas",
        description: "El usuario o contraseña no coinciden con los registros autorizados.",
      });
    } else {
      toast({
        title: "Acceso Validado",
        description: "Sincronizando con el servidor técnico de Tamer...",
      });
    }
    setIsLoggingIn(false);
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-2xl">
          <AlertCircle className="w-20 h-20 text-destructive mx-auto" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Falta Identificación</h1>
          <p className="text-muted-foreground font-medium">Por favor, escanee el código QR técnico para acceder.</p>
          <Button onClick={() => router.push('/login')} variant="outline" className="rounded-xl font-black">VOLVER AL INICIO</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <p className="text-lg font-black text-primary uppercase tracking-widest">Validando Seguridad v3.3.3...</p>
        </div>
      </div>
    );
  }

  if (!obra || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-2xl">
          <AlertCircle className="w-20 h-20 text-destructive mx-auto" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Obra No Encontrada</h1>
          <p className="text-muted-foreground font-medium">El registro solicitado no existe o ha sido removido.</p>
          <Button onClick={() => router.push('/login')} className="bg-[#0a3d62] rounded-xl font-black">REGRESAR</Button>
        </div>
      </div>
    );
  }

  // Si no está autorizado para ESTA obra específica
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 text-center text-white relative">
            <div className="absolute top-4 right-4 opacity-20">
              <Construction className="w-12 h-12" />
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Acceso Restringido</h2>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Tamer Industrial S.A. v3.3.3</p>
          </div>
          <CardContent className="p-10">
            <div className="mb-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">PROYECTO DETECTADO</p>
              <h3 className="font-black text-xl text-[#0a3d62] leading-tight uppercase">{obra.nombreObra}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black">OF: {obra.numeroOF}</Badge>
                <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black">OT: {obra.numeroOT}</Badge>
              </div>
            </div>

            {isUser && !isAuthorized && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-amber-800 uppercase leading-tight">Sin Permisos para esta Obra</p>
                  <p className="text-[10px] text-amber-700 font-medium">Su cuenta no está habilitada para visualizar esta documentación técnica.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="text-amber-600 hover:bg-amber-100 rounded-xl">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email de Obra Autorizado</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-lg focus:bg-white transition-all px-6"
                  placeholder="usuario@obra.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Clave de Seguridad de Campo</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-lg focus:bg-white transition-all px-6 pr-14"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0a3d62] hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-[1.5rem] font-black text-lg gap-3 mt-6 shadow-2xl shadow-[#0a3d62]/30 active:scale-95 transition-all"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin w-6 h-6" /> : <><ShieldCheck className="w-6 h-6" /> VALIDAR ACCESO</>}
              </Button>
            </form>
          </CardContent>
          <div className="px-10 pb-10">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center leading-relaxed">
              DOCUMENTACIÓN TÉCNICA CONFIDENCIAL. ACCESO PROTEGIDO POR TAMER CLOUD.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20 font-body">
      <div className="bg-[#0a3d62] text-white pt-16 pb-24 px-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Construction className="w-64 h-64" />
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl p-4 transform hover:rotate-3 transition-transform">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="w-12 h-12 text-[#0a3d62]" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-none">{empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}</h1>
              <p className="text-[10px] font-black opacity-60 tracking-[0.5em] uppercase">DOCUMENTACIÓN TÉCNICA DIGITAL v3.3.3</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            <Badge className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-2xl py-3 px-8 rounded-[1.5rem] shadow-xl">
              OF: {obra.numeroOF}
            </Badge>
            <Button variant="ghost" onClick={logout} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-black text-[10px] tracking-widest gap-2">
              <LogOut className="w-4 h-4" /> CERRAR SESIÓN DE OBRA
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-16 space-y-10">
        <Card className="border-none shadow-2xl overflow-hidden rounded-[3.5rem] bg-white">
          <CardHeader className="py-12 border-b bg-gray-50/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-6 bg-primary/10 rounded-[2.5rem] shadow-inner">
                <Construction className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center md:text-left space-y-2">
                <CardTitle className="text-3xl sm:text-5xl uppercase font-black text-[#0a3d62] leading-none tracking-tighter">
                  {obra.nombreObra}
                </CardTitle>
                <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest">INGENIERÍA E INSTALACIONES INDUSTRIALES</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 space-y-8 border-b md:border-b-0 md:border-r">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-[#f8fafc] rounded-2xl shadow-sm shrink-0 border border-secondary">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Cliente Final</p>
                    <p className="font-black text-2xl text-[#0a3d62] leading-tight">{obra.cliente}</p>
                    <p className="text-xs font-bold text-primary mt-1">CÓDIGO INTERNO: {obra.codigoCliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-[#f8fafc] rounded-2xl shadow-sm shrink-0 border border-secondary">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Ubicación de Obra</p>
                    <p className="font-bold text-xl text-gray-800">{obra.direccion || 'Instalación Industrial Tamer'}</p>
                  </div>
                </div>
              </div>
              <div className="p-10 space-y-6 bg-[#fcfcfc]">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm shrink-0 border border-secondary">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Detalles Técnicos</p>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {obra.descripcion || 'Este proyecto cuenta con certificación técnica integral. La documentación adjunta es la versión vigente para ejecución en campo.'}
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Validación de Acceso v3.3.3 Activa</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-4">
              <FileText className="w-6 h-6 text-primary" /> CARPETA TÉCNICA DIGITAL
            </h3>
            <span className="text-[10px] font-black text-muted-foreground bg-white px-4 py-2 rounded-full shadow-sm">{obra.files?.length || 0} DOCUMENTOS</span>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white group rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-primary/10">
                  <CardContent className="p-6 sm:p-8 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-[#f8fafc] rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-[#0a3d62] group-hover:text-white transition-all duration-500 shadow-sm">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="overflow-hidden space-y-1">
                        <p className="font-black text-[#0a3d62] text-lg sm:text-xl truncate max-w-[160px] sm:max-w-md">
                          {fileName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">EXPEDIENTE DISPONIBLE</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="w-12 h-12 rounded-2xl border-2 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all" 
                        onClick={() => setSelectedFile(fileName)}
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="w-12 h-12 rounded-2xl border-2 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-white/40 border-4 border-dashed border-secondary rounded-[4rem] p-24 text-center space-y-6">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">Sin Documentos Cargados</p>
                  <p className="text-xs text-muted-foreground/60 font-medium">No se han vinculado planos digitales a este proyecto.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
          <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 rounded-[3rem] overflow-hidden border-none shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col">
            <DialogHeader className="p-6 bg-[#0a3d62] text-white shrink-0 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tighter truncate pr-8">
                  {selectedFile}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1">
                  Visor Técnico Tamer Industrial
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="flex-1 w-full bg-[#f1f5f9] flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-8">
                <div className="relative">
                  <Loader2 className="w-20 h-20 animate-spin text-primary/20" />
                  <FileText className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-[#0a3d62] uppercase tracking-tighter">Sincronizando Archivo</h3>
                  <p className="text-sm text-muted-foreground font-bold max-w-sm mx-auto uppercase tracking-wide">
                    Descargando documentación desde el almacenamiento seguro de Drive.
                  </p>
                </div>
                <Button className="rounded-2xl bg-[#0a3d62] h-16 px-12 font-black text-lg gap-3 shadow-2xl shadow-[#0a3d62]/20 active:scale-95 transition-all">
                  <Download className="w-6 h-6" /> DESCARGAR ORIGINAL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <footer className="pt-20 text-center space-y-10">
          <div className="h-1.5 bg-[#0a3d62]/5 rounded-full w-32 mx-auto" />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-black tracking-[0.5em] uppercase">
              © {new Date().getFullYear()} {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </p>
            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">
              SISTEMA DE GESTIÓN TÉCNICA | v3.3.3
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Cargando...</p>
        </div>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
