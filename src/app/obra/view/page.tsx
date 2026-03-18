
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
  LogOut,
  FolderOpen
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

  // Validación de autorización estricta v3.3.5
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    
    // 1. Administradores: Acceso Total
    if (isAdmin) return true;

    // 2. Usuarios de Campo (Field): Solo acceden si el ID coincide exactamente con esta obra
    if (user.role === 'field') {
      return user.id === id;
    }

    // 3. Clientes (User): Acceden si su email está en la lista de autorizados de esta obra
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
    
    // Pasamos el ID de la obra para que el login sea EXCLUSIVO para este proyecto
    const success = await login(identifier, password, id);
    
    if (!success) {
      toast({
        variant: "destructive",
        title: "Acceso Denegado",
        description: "Las credenciales no corresponden a esta obra o no son válidas.",
      });
    } else {
      toast({
        title: "Identidad Validada",
        description: "Acceso concedido a la documentación v3.3.5.",
      });
    }
    setIsLoggingIn(false);
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f1f5f9]">
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black text-[#0a3d62]">QR Inválido</h1>
          <p className="text-muted-foreground mb-6">El código escaneado no contiene un ID de obra válido.</p>
          <Button onClick={() => router.push('/login')} className="rounded-xl w-full">VOLVER</Button>
        </Card>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3d62]">Validando Seguridad v3.3.5</p>
      </div>
    </div>
  );

  if (!obra || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f1f5f9]">
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Obra no Registrada</h1>
          <p className="text-muted-foreground mb-6">El registro técnico de esta obra ha sido removido o no existe.</p>
          <Button onClick={() => router.push('/login')} className="rounded-xl w-full">REGRESAR</Button>
        </Card>
      </div>
    );
  }

  // Interfaz de Login si no está autorizado para ESTA obra específica
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-10 text-center text-white relative">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Acceso por QR</h2>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Tamer Industrial S.A. v3.3.5</p>
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

            {isUser && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] text-amber-800 font-black uppercase leading-tight">Su sesión actual no está autorizada para este proyecto.</p>
                  <Button variant="link" size="sm" onClick={logout} className="h-auto p-0 text-[10px] font-black text-amber-900 uppercase underline decoration-amber-400">Cerrar sesión e ingresar</Button>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Email de Obra</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-lg"
                  placeholder="usuario@tamer.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Clave de Acceso</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-lg pr-14"
                    placeholder="••••••••"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5 text-primary" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 bg-[#0a3d62] rounded-[1.5rem] font-black text-lg gap-3 shadow-2xl shadow-[#0a3d62]/30 active:scale-95 transition-all"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin w-6 h-6" /> : <><ShieldCheck className="w-6 h-6" /> VALIDAR PARA ESTA OBRA</>}
              </Button>
            </form>
          </CardContent>
          <div className="px-10 pb-10">
            <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center leading-relaxed">
              ESTAS CREDENCIALES SON EXCLUSIVAS PARA ESTE PROYECTO v3.3.5
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Interfaz de Visualización Autorizada
  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20 font-body">
      <div className="bg-[#0a3d62] text-white pt-16 pb-24 px-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center p-3 shadow-2xl">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="w-10 h-10 text-[#0a3d62]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase leading-none">{empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}</h1>
              <p className="text-[10px] font-black opacity-60 tracking-[0.5em] uppercase mt-2">Visor de Documentación v3.3.5</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Badge className="bg-white/10 text-white font-mono text-xl py-2 px-6 rounded-xl border-white/20">
              OF: {obra.numeroOF}
            </Badge>
            <Button variant="ghost" onClick={logout} className="text-white/60 hover:text-white hover:bg-white/10 font-black text-[10px] tracking-widest uppercase">
              <LogOut className="w-4 h-4 mr-2" /> Salir del Proyecto
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-12 space-y-10 relative z-20">
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b bg-gray-50/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-5 bg-primary/10 rounded-[2rem]">
                <Construction className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <CardTitle className="text-3xl font-black text-[#0a3d62] uppercase tracking-tighter">{obra.nombreObra}</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Identidad Corporativa Tamer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <UserIcon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cliente Autorizado</p>
                    <p className="font-black text-xl text-[#0a3d62] uppercase">{obra.cliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Localización</p>
                    <p className="font-bold text-lg">{obra.direccion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#f8fafc] p-6 rounded-[2rem] border border-secondary flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                  <Info className="w-3 h-3" /> Información Técnica
                </p>
                <p className="text-xs font-medium text-gray-700 leading-relaxed italic">
                  {obra.descripcion || 'Planos y documentación vigente para la ejecución de tareas.'}
                </p>
              </div>
            </div>

            {/* ACCESO DIRECTO A DRIVE v3.3.5 */}
            {obra.driveFolderUrl && (
              <div className="mt-10 pt-10 border-t">
                <Button 
                  asChild
                  className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 rounded-[2rem] text-xl font-black gap-4 shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                    <FolderOpen className="w-8 h-8" /> CARPETA DE PLANOS EN DRIVE
                  </a>
                </Button>
                <p className="text-center text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-4">
                  Solo personal autorizado por Tamer Industrial
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="px-6 flex items-center justify-between">
            <h3 className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" /> Documentación Individual
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white group rounded-[2rem] overflow-hidden border-2 border-transparent hover:border-primary/10">
                  <CardContent className="p-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-primary group-hover:bg-[#0a3d62] group-hover:text-white transition-all">
                        <FileText className="w-7 h-7" />
                      </div>
                      <p className="font-black text-[#0a3d62] text-lg truncate max-w-[200px] sm:max-w-md">
                        {fileName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-2" onClick={() => setSelectedFile(fileName)}>
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-2">
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-20 text-center border-4 border-dashed rounded-[3rem] border-secondary bg-white/50">
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Sin archivos técnicos registrados.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-10 text-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
          © {new Date().getFullYear()} {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'} | v3.3.5
        </footer>
      </div>

      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] p-0 rounded-[2.5rem] overflow-hidden">
          <div className="bg-[#0a3d62] text-white p-6 font-black uppercase tracking-tighter truncate flex justify-between items-center">
            <span>VISUALIZACIÓN: {selectedFile}</span>
          </div>
          <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm font-black uppercase tracking-widest text-[#0a3d62]">Conectando con Servidor Cloud...</p>
            <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest">Descargar Original</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black uppercase text-xs tracking-[0.3em]">Sincronizando con Tamer Cloud v3.3.5...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
