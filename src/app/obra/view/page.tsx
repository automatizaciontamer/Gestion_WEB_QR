
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
  FolderOpen
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

  // Verificación de autorización estricta para la obra específica
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    if (isAdmin) return true;
    
    // Comparación normalizada de correos de acceso
    const normalizedUserEmail = user.email?.toLowerCase().trim();
    const normalizedObraEmail = obra.usuarioAcceso?.toLowerCase().trim();
    
    // Si es personal de campo, debe coincidir exactamente con esta obra
    if (user.role === 'field') {
      return user.id === id || normalizedUserEmail === normalizedObraEmail;
    }

    // Usuarios clientes autorizados
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
              <h3 className="font-black text-base text-[#0a3d62] uppercase truncate mt-1">{obra.nombreObra}</h3>
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
      {/* Cabecera optimizada para evitar solapamiento */}
      <div className="bg-[#0a3d62] text-white pt-8 pb-12 px-4 relative">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Construction className="w-8 h-8 text-[#0a3d62]" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-base sm:text-xl font-black tracking-tight uppercase leading-tight">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h1>
            <p className="text-[8px] font-black opacity-40 tracking-[0.3em] uppercase">Documentación Técnica v3.5.3</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full h-8 px-5 font-black text-[8px] uppercase tracking-widest mt-1">
            <LogOut className="w-3.5 h-3.5 mr-2" /> CERRAR SESIÓN
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6 -mt-6 relative z-10">
        <Card className="border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-6 border-b bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                <Construction className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-black text-[#0a3d62] uppercase truncate leading-none mb-2">
                  {obra.nombreObra}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-2 py-0.5">OF: {obra.numeroOF}</Badge>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-2 py-0.5">OT: {obra.numeroOT}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">Ubicación Obra</p>
                    <p className="font-bold text-[#0a3d62] text-xs">{obra.direccion || 'Dirección no disponible'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">Especificaciones</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed font-medium">{obra.descripcion || 'Sin descripción técnica cargada.'}</p>
                  </div>
                </div>
              </div>

              {obra.driveFolderUrl && (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col items-center gap-3">
                  <FolderOpen className="w-8 h-8 text-emerald-600" />
                  <p className="text-[10px] font-black text-[#0a3d62] uppercase text-center tracking-wider">CARPETA COMPLETA DE PLANOS (DRIVE)</p>
                  <Button asChild className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-black gap-2 shadow-lg shadow-emerald-600/20">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" /> ACCEDER A LA CARPETA
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Listado de archivos optimizado */}
        <div className="space-y-3 px-1">
          <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Documentación Sincronizada
          </h3>
          
          <div className="grid grid-cols-1 gap-2">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-secondary flex items-center justify-between gap-3 group transition-all hover:border-primary/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-[#0a3d62] text-xs truncate max-w-[180px] sm:max-w-none">{fileName}</p>
                  </div>
                  {obra.driveFolderUrl && (
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shrink-0">
                      <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-3xl border-slate-200 bg-white/50">
                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[8px]">No se han cargado archivos técnicos aún.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-8 text-center">
          <p className="text-[8px] font-black text-muted-foreground opacity-30 uppercase tracking-[0.4em]">
            TAMER INDUSTRIAL S.A. | GESTIÓN CLOUD
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
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
