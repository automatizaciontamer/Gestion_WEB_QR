"use client"

import { useSearchParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, Suspense } from 'react';
import { Obra } from '@/lib/types';
import { 
  FileText, 
  Download, 
  Construction, 
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);
  const { user, isAdmin, login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [requestedFile, setRequestedFile] = useState<string | null>(null);

  // Authorization check
  const isAuthorized = useMemo(() => {
    if (isAdmin) return true;
    if (user && user.role === 'field' && user.id === id) return true;
    return false;
  }, [user, isAdmin, id]);

  const files = useMemo(() => {
    if (!obra) return [];
    return obra.files || [];
  }, [obra]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando v5.2.0...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
        </div>
      </div>
    );
  }

  if (requestedFile && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a3d62] flex flex-col items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-md bg-white rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-none overflow-hidden pb-4 relative">
          <Button variant="ghost" className="absolute top-6 right-6 text-white hover:bg-white/20 z-10 rounded-full w-10 h-10 p-0" onClick={() => setRequestedFile(null)}>
             <X className="w-5 h-5" />
          </Button>
          <div className="bg-[#0a3d62] p-10 pt-16 text-center text-white relative">
             <div className="w-20 h-20 bg-white shadow-xl flex items-center justify-center rounded-[2rem] mx-auto absolute -top-10 left-1/2 -translate-x-1/2">
                <Lock className="w-8 h-8 text-primary" />
             </div>
             <Construction className="w-12 h-12 text-primary mx-auto mb-4" />
             <h1 className="font-black text-xl uppercase tracking-widest">{obra.nombreObra}</h1>
             <p className="text-[10px] uppercase font-black tracking-widest text-[#0a3d62] bg-primary px-4 py-2 mt-4 rounded-full absolute top-[100%] left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-white whitespace-nowrap shadow-lg">Descarga Protegida</p>
          </div>
          <CardContent className="p-10 pt-16 space-y-6">
            <form onSubmit={async (e) => {
               e.preventDefault();
               setIsAuthenticating(true);
               setAuthError(false);
               const success = await login(email, password, id);
               if (success) {
                 window.open(requestedFile, '_blank');
                 setRequestedFile(null);
               } else {
                 setAuthError(true);
               }
               setIsAuthenticating(false);
            }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Usuario Valido</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg" placeholder="Email corporativo..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Clave de Acceso</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="h-16 rounded-2xl bg-secondary/30 border-none font-bold text-lg pr-12" placeholder="••••••••" />
                    <Button type="button" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
              {authError && <div className="bg-red-50 text-destructive text-center text-[10px] font-black uppercase tracking-wider p-3 rounded-xl mt-4 animate-pulse border border-red-100">🚫 Credenciales denegadas / Obra bloqueada</div>}
              <Button type="submit" disabled={isAuthenticating} className="w-full h-16 bg-primary hover:bg-primary/90 text-[#0a3d62] font-black text-xl gap-3 mt-6 rounded-[2rem] shadow-xl shadow-primary/30 transition-all active:scale-95">
                 {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'INGRESAR CARPETA'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-[#0a3d62] text-white py-12 px-6 border-b-8 border-primary shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl">
              <Construction className="text-[#0a3d62] w-7 h-7" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">TAMER INDUSTRIAL S.A.</p>
              <h2 className="text-xs font-black uppercase opacity-60">Visor Técnico v5.2.0</h2>
            </div>
          </div>
          
          <div className="pt-4">
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-primary text-white text-[10px] font-black px-5 py-2 rounded-lg">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white text-[10px] font-black px-5 py-2 rounded-lg">OT: {obra.numeroOT}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-12 space-y-12">
        <div className="bg-white rounded-[2.5rem] shadow-xl border p-10">
          <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Cliente / Razón Social</p>
          <p className="font-black text-2xl text-[#0a3d62] uppercase leading-none">{obra.cliente}</p>
        </div>

        <div className="space-y-6">
          <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" /> PLANOS Y DOCUMENTACIÓN
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {files.length > 0 ? files.map((file, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-md border flex items-center justify-between group transition-all hover:border-primary/50">
                <div className="flex items-center gap-6 overflow-hidden">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0 shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden pr-4">
                    <p className="font-black text-[#0a3d62] text-sm uppercase truncate">{file.name || `Archivo Técnico ${idx + 1}`}</p>
                  </div>
                </div>
                
                {file.url ? (
                  <button 
                    onClick={() => {
                        if (isAuthorized) {
                            window.open(file.url, '_blank');
                        } else {
                            setRequestedFile(file.url as string);
                        }
                    }}
                    className="h-12 px-6 rounded-xl bg-primary hover:bg-[#0a3d62] flex items-center justify-center text-white transition-all active:scale-95 shrink-0 gap-3 font-black text-xs uppercase shadow-lg shadow-primary/20"
                  >
                    <Download className="w-4 h-4" /> DESCARGAR
                  </button>
                ) : (
                  <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                     <p className="text-[8px] font-black text-red-500 uppercase tracking-tighter">SIN LINK VÁLIDO</p>
                  </div>
                )}
              </div>
            )) : (
              <div className="bg-white p-12 rounded-[2rem] text-center border-4 border-dashed border-slate-100">
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">No hay planos registrados en esta obra.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-12 text-center mt-auto">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">
          TAMER INDUSTRIAL S.A. | GESTIÓN CLOUD v5.2.0
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest">Iniciando Visor...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
