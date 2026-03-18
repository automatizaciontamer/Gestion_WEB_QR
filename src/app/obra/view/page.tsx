
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
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { isUser, user, isAdmin, login, logout, empresa, loading: authLoading } = useAuth();
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

  const { data: obra, loading: docLoading, error } = useDoc<Obra>(obraDocRef);

  // Validación de autorización unificada v3.5.0
  const isAuthorized = useMemo(() => {
    if (!isUser || !user || !obra) return false;
    if (isAdmin) return true;
    
    const normalizedUserEmail = user.email?.toLowerCase().trim();
    const normalizedObraEmail = obra.usuarioAcceso?.toLowerCase().trim();
    
    // Si el usuario es 'field' (acceso directo de obra), debe coincidir el ID
    if (user.role === 'field') {
      return user.id === id || normalizedUserEmail === normalizedObraEmail;
    }

    // Para otros roles, verificar email en lista o email principal
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

  // Pantalla de carga inicial
  if (authLoading || (docLoading && !obra)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a3d62]">Sincronizando Documentación v3.5.0...</p>
        </div>
      </div>
    );
  }

  // Error: No hay ID o no existe la obra
  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <Card className="max-w-md w-full p-8 text-center rounded-[2rem] shadow-2xl border-none">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-xl font-black text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-8 italic">El enlace QR no es válido o la obra fue removida.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl font-black bg-[#0a3d62]">IR AL INICIO</Button>
        </Card>
      </div>
    );
  }

  // Interfaz de Login si no está autorizado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase tracking-tight">Acceso Restringido</h2>
            <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.3em] mt-2">Validación de Seguridad v3.5.0</p>
          </div>
          <CardContent className="p-8">
            <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
              <span className="text-[9px] font-black text-[#0a3d62] uppercase tracking-widest opacity-60">PROYECTO</span>
              <h3 className="font-black text-xl text-[#0a3d62] uppercase truncate mt-1">{obra.nombreObra}</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Email Autorizado</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-14 rounded-xl bg-secondary/30 border-none font-bold text-base px-5"
                  placeholder="usuario@tamer.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Clave Técnica</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-14 rounded-xl bg-secondary/30 border-none font-bold text-base px-5 pr-12"
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
                className="w-full h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black text-lg gap-3 shadow-lg active:scale-95 transition-all mt-4"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-6 h-6" /> DESBLOQUEAR OBRA</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // VISTA TÉCNICA AUTORIZADA
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 overflow-x-hidden">
      {/* Header Responsivo */}
      <div className="bg-[#0a3d62] text-white pt-16 pb-24 px-6 relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Construction className="w-10 h-10 text-[#0a3d62]" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase leading-tight">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h1>
            <p className="text-[9px] font-black opacity-40 tracking-[0.3em] uppercase">Documentación Técnica v3.5.0</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full h-10 px-6 font-black text-[10px] uppercase tracking-widest">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Salir del Visor
          </Button>
        </div>
      </div>

      {/* Contenido Principal Ajustado */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 space-y-6">
        <Card className="border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-gray-50/50">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Construction className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-black text-[#0a3d62] uppercase truncate leading-none mb-2">
                  {obra.nombreObra}
                </CardTitle>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3">OF: {obra.numeroOF}</Badge>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3">OT: {obra.numeroOT}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Ubicación</p>
                    <p className="font-bold text-[#0a3d62] text-sm leading-tight">{obra.direccion || 'No especificada'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Detalles del Proyecto</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{obra.descripcion || 'Sin descripción adicional.'}</p>
                  </div>
                </div>
              </div>

              {/* Botón Principal de Descarga v3.5.0 */}
              <div className="bg-secondary/20 p-6 rounded-3xl border border-secondary flex flex-col items-center justify-center text-center">
                <FolderOpen className="w-10 h-10 text-emerald-600 mb-3" />
                <h4 className="font-black text-[#0a3d62] text-sm uppercase mb-4">Carpeta de Planos en Drive</h4>
                {obra.driveFolderUrl ? (
                  <Button asChild className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-base font-black gap-2 shadow-lg active:scale-95 transition-all">
                    <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-5 h-5" /> DESCARGAR TODO
                    </a>
                  </Button>
                ) : (
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Acceso no configurado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listado de Archivos Individuales */}
        <div className="space-y-4 px-2">
          <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" /> Documentación Sincronizada
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-secondary flex items-center justify-between gap-4 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-[#0a3d62] text-sm truncate pr-2">{fileName}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setSelectedFile(fileName)}>
                      <Eye className="w-5 h-5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-emerald-600">
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed rounded-3xl border-slate-200 bg-white/50">
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">No hay archivos individuales cargados.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-10 text-center">
          <p className="text-[9px] font-black text-muted-foreground opacity-30 uppercase tracking-[0.5em]">
            TAMER INDUSTRIAL S.A. | v3.5.0
          </p>
        </footer>
      </div>

      {/* Visor de Planos v3.5.0 */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[85vh] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="bg-[#0a3d62] text-white p-6 font-black uppercase text-sm flex justify-between items-center">
            <span className="truncate mr-4">PLANO: {selectedFile}</span>
          </div>
          <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-[#0a3d62] uppercase tracking-tight">Abriendo visor de planos...</p>
              <p className="text-xs text-muted-foreground font-bold italic">Sincronizando con el servidor de Tamer Cloud</p>
            </div>
            {obra.driveFolderUrl && (
              <Button asChild className="rounded-xl h-14 px-8 font-black uppercase bg-[#0a3d62] shadow-xl">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer">VER EN PANTALLA COMPLETA</a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
