
"use client"

import { useSearchParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, Suspense, useState } from 'react';
import { Obra } from '@/lib/types';
import { 
  FileText, 
  Download, 
  Construction, 
  MapPin, 
  User, 
  Info,
  Loader2,
  AlertCircle,
  ExternalLink,
  Eye,
  Lock,
  ChevronRight,
  ShieldCheck,
  EyeOff
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
  const { isUser, login, empresa } = useAuth();
  const { toast } = useToast();
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(identifier, password);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Acceso Denegado",
        description: "Credenciales incorrectas para esta documentación.",
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
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <p className="text-lg font-black text-primary uppercase tracking-widest">Verificando Obra...</p>
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
          <p className="text-muted-foreground font-medium">El registro solicitado no existe en el sistema.</p>
        </div>
      </div>
    );
  }

  if (!isUser) {
    return (
      <div className="min-h-screen bg-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Acceso Restringido</h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Portal Técnico Tamer Industrial</p>
          </div>
          <CardContent className="p-8">
            <div className="mb-6 p-4 bg-primary/10 rounded-2xl flex items-start gap-3">
              <Construction className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-black text-primary text-sm uppercase">{obra.nombreObra}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Escaneado: OF {obra.numeroOF}</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuario / Email Autorizado</Label>
                <Input 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/30 border-none font-bold"
                  placeholder="email@autorizado.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/30 border-none font-bold pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl font-black gap-2 mt-4 shadow-xl shadow-[#0a3d62]/20"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> VALIDAR ACCESO</>}
              </Button>
            </form>
          </CardContent>
          <div className="p-6 bg-secondary/20 text-center">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              Uso exclusivo para personal de obra y clientes autorizados.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-20 font-body">
      <div className="bg-[#0a3d62] text-white py-12 px-6 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 p-2">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Construction className="w-10 h-10 text-[#0a3d62]" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">{empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}</h1>
              <p className="text-[10px] font-black opacity-60 tracking-[0.4em] mt-1 uppercase">SISTEMA DIGITAL DE PLANOS Y DOCUMENTACIÓN</p>
            </div>
          </div>
          <Badge variant="outline" className="border-white/30 text-white font-mono text-xl py-2 px-6 rounded-2xl bg-white/10 backdrop-blur-md">
            OF: {obra.numeroOF}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 space-y-8">
        <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
          <CardHeader className="py-8 border-b">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Construction className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl uppercase font-black text-[#0a3d62] leading-tight">
                {obra.nombreObra}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-8 space-y-6 border-b md:border-b-0 md:border-r">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cliente / Solicitante</p>
                    <p className="font-black text-lg text-gray-800">{obra.cliente}</p>
                    <p className="text-xs font-mono text-primary font-bold">Ref: {obra.codigoCliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ubicación Técnica</p>
                    <p className="font-bold text-gray-800">{obra.direccion || 'Instalación Industrial Tamer'}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-4 bg-gray-50/50">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Especificaciones</p>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {obra.descripcion || 'Documentación técnica estandarizada bajo normas de ingeniería vigentes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <h3 className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.3em] px-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" /> PLANOS Y ARCHIVOS AUTORIZADOS
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white group rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-secondary rounded-xl sm:rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-[#0a3d62] text-sm sm:text-base truncate max-w-[140px] sm:max-w-md">
                          {fileName}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black tracking-widest">Revisión Técnica APROBADA</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white" 
                        onClick={() => setSelectedFile(fileName)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-white/50 border-4 border-dashed border-secondary rounded-[2.5rem] p-16 text-center space-y-4">
                <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Aún no se han vinculado planos digitales</p>
              </div>
            )}
          </div>
        </div>

        <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
          <DialogContent className="max-w-[95vw] w-full h-[85vh] p-0 rounded-3xl overflow-hidden border-none shadow-2xl flex flex-col">
            <DialogHeader className="p-4 bg-[#0a3d62] text-white shrink-0">
              <DialogTitle className="text-sm font-black uppercase tracking-widest truncate pr-8">
                {selectedFile}
              </DialogTitle>
              <DialogDescription className="text-[10px] text-white/60 font-bold">
                Visor de documentación técnica {empresa?.nombre || 'Tamer Industrial'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">
                <Loader2 className="w-12 h-12 animate-spin text-[#0a3d62]/20" />
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#0a3d62]">Visor de Documentos</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                    El archivo se está cargando desde el servidor seguro. 
                    Si la previsualización no carga, utilice el botón de descarga.
                  </p>
                </div>
                <Button className="rounded-2xl bg-[#0a3d62] h-14 px-8 font-black gap-2 shadow-xl shadow-[#0a3d62]/20">
                  <Download className="w-5 h-5" /> DESCARGAR ARCHIVO
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <footer className="pt-12 text-center space-y-6">
          <div className="h-1 bg-[#0a3d62]/10 rounded-full w-24 mx-auto" />
          <div>
            <p className="text-[10px] text-muted-foreground font-black tracking-[0.4em] uppercase">
              © {new Date().getFullYear()} {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </p>
            <p className="text-[9px] text-muted-foreground/60 font-medium mt-1">
              Desarrollo de Ingeniería | Control de Calidad | Sincronización en Tiempo Real
            </p>
          </div>
          <Button variant="ghost" className="text-primary font-black text-[10px] tracking-widest gap-2 opacity-60 hover:opacity-100" asChild>
            <a href="https://tamer.com.ar" target="_blank" rel="noopener noreferrer">
              VISITAR SITIO WEB OFICIAL <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
