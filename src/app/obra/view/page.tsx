
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
  LogOut,
  FolderOpen,
  ArrowRight
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
    
    const normalizedUserEmail = user.email?.toLowerCase().trim();
    const normalizedObraEmail = obra.usuarioAcceso?.toLowerCase().trim();
    
    return normalizedUserEmail === normalizedObraEmail || 
           obra.authorizedEmails?.some(e => e.email?.toLowerCase().trim() === normalizedUserEmail);
  }, [isUser, user, obra, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsLoggingIn(true);
    const success = await login(identifier, password, id);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Acceso Denegado",
        description: "Credenciales incorrectas para este proyecto.",
      });
    }
    setIsLoggingIn(false);
  };

  if (authLoading || (docLoading && !obra)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!id || (!obra && !docLoading)) {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center"><Card className="p-10 max-w-sm w-full"><AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" /><h1 className="font-black">PROYECTO NO ENCONTRADO</h1><Button onClick={() => router.push('/login')} className="mt-4 w-full">VOLVER</Button></Card></div>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <div className="bg-[#0a3d62] p-8 text-center text-white">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-2" />
            <h2 className="text-xl font-black uppercase">Validación de Obra</h2>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl text-center"><p className="text-[10px] font-black uppercase text-muted-foreground">PROYECTO:</p><h3 className="font-black text-[#0a3d62] uppercase leading-tight">{obra.nombreObra}</h3></div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase ml-2">Email Autorizado</Label><Input value={identifier} onChange={e => setIdentifier(e.target.value)} className="h-14 rounded-xl font-bold" required /></div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase ml-2">Clave</Label><div className="relative"><Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-xl font-bold pr-12" required /><Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
              <Button type="submit" className="w-full h-14 bg-[#0a3d62] font-black text-lg" disabled={isLoggingIn}>{isLoggingIn ? <Loader2 className="animate-spin" /> : "ACCEDER"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-[#0a3d62] text-white pt-10 pb-16 px-6 shadow-xl">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="bg-white p-2 rounded-lg w-12 h-12 flex items-center justify-center">
              {empresa?.logoUrl ? <img src={empresa.logoUrl} className="w-full h-full object-contain" /> : <Construction className="text-[#0a3d62]" />}
            </div>
            <Button variant="ghost" onClick={logout} className="text-white border border-white/20 h-9 px-4 font-black text-[10px]">SALIR</Button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase leading-tight">{obra.nombreObra}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary text-white font-black text-[10px] px-3 py-1.5 rounded-lg uppercase">OF: {obra.numeroOF}</span>
            <span className="bg-white/10 text-white font-black text-[10px] px-3 py-1.5 rounded-lg uppercase">OT: {obra.numeroOT}</span>
            <span className="bg-white/10 text-white font-black text-[10px] px-3 py-1.5 rounded-lg uppercase">ID: {obra.codigoCliente}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Cliente:</p><p className="font-black text-[#0a3d62] text-lg uppercase">{obra.cliente}</p></div>
            <div><p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Ubicación:</p><div className="flex gap-2 font-bold text-[#0a3d62]"><MapPin className="w-4 h-4 text-primary" />{obra.direccion || 'No definida'}</div></div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-2 px-2">
            <FileText className="w-5 h-5 text-primary" /> REPOSITORIO DE DOCUMENTACIÓN
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.map((file, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><FileText /></div>
                  <div className="min-w-0">
                    <p className="font-black text-[#0a3d62] text-sm sm:text-base truncate uppercase">{file.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Plano Sincronizado</p>
                  </div>
                </div>
                {file.id ? (
                  <Button asChild className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0">
                    <a href={`https://drive.google.com/uc?id=${file.id}&export=download`} target="_blank">
                      <Download className="w-5 h-5" />
                    </a>
                  </Button>
                ) : (
                  <div className="text-[10px] font-black text-muted-foreground/40 italic">SIN ENLACE</div>
                )}
              </div>
            ))}

            {obra.driveFolderUrl && (
              <Button asChild className="w-full h-20 rounded-[2rem] bg-[#0a3d62] font-black text-lg gap-4 shadow-xl mt-4">
                <a href={obra.driveFolderUrl} target="_blank">
                  <FolderOpen className="w-8 h-8 text-primary" />
                  CARPETA COMPLETA EN DRIVE
                  <ArrowRight className="w-6 h-6 ml-auto" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ObraViewPage() {
  return <Suspense><ObraViewContent /></Suspense>;
}
