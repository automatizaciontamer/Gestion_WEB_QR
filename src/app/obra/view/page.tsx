
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
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
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();
  const { empresa } = useAuth();
  const router = useRouter();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading: docLoading } = useDoc<Obra>(obraDocRef);

  const files = useMemo(() => {
    if (!obra) return [];
    const source = (obra as any).files || (obra as any).archivos || [];
    return Array.isArray(source) ? source : [];
  }, [obra]);

  const getDownloadUrl = (file: any) => {
    if (!file) return '';
    let driveId = '';
    
    if (typeof file === 'string') {
      const match = file.match(/[-\w]{25,}/);
      driveId = match ? match[0] : file;
    } else if (typeof file === 'object') {
      driveId = file.id || file.fileId || file.googleId || '';
      if (!driveId) {
        for (const key in file) {
          const val = file[key];
          if (typeof val === 'string') {
            const match = val.match(/[-\w]{25,}/);
            if (match) {
              driveId = match[0];
              break;
            }
          }
        }
      }
    }
    
    if (!driveId || driveId.length < 20) return '';
    return `https://drive.google.com/uc?id=${driveId}&export=download`;
  };

  const getFileName = (file: any, index: number) => {
    if (typeof file === 'string') return `Plano Técnico ${index + 1}`;
    return file.name || `Documento ${index + 1}`;
  };

  if (docLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando v5.0.6...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8">VOLVER</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-[#0a3d62] text-white py-12 px-6 border-b-8 border-primary shadow-2xl relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl overflow-hidden">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-7 h-7" />
                )}
               </div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">TAMER INDUSTRIAL S.A.</p>
                 <h2 className="text-xs font-black uppercase opacity-60">Visor de Planos</h2>
               </div>
             </div>
             <Button variant="ghost" onClick={() => router.push('/login')} className="text-white/40 hover:bg-white/10 rounded-xl border border-white/10">
               <ArrowLeft className="w-4 h-4 mr-2" /> SALIR
             </Button>
          </div>
          
          <div className="space-y-4 pt-6">
            <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight tracking-tighter drop-shadow-xl">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary text-white text-[10px] font-black px-5 py-2.5 rounded-xl">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white text-[10px] font-black px-5 py-2.5 rounded-xl">OT: {obra.numeroOT}</div>
              <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-5 py-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> PLANOS VERIFICADOS
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-12 space-y-12">
        <div className="bg-white rounded-[3rem] shadow-xl border p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Cliente</p>
            <p className="font-black text-2xl text-[#0a3d62] uppercase leading-none">{obra.cliente}</p>
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Dirección</p>
            <p className="font-bold text-[#0a3d62] text-sm uppercase">{obra.direccion || 'Sin dirección registrada'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" /> DOCUMENTACIÓN TÉCNICA
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {files.length > 0 ? files.map((file, idx) => {
              const downloadUrl = getDownloadUrl(file);
              const fileName = getFileName(file, idx);
              return (
                <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-md border hover:border-primary transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6 overflow-hidden">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-[#0a3d62] text-base uppercase truncate pr-4">{fileName}</p>
                    </div>
                  </div>
                  {downloadUrl ? (
                    <a 
                      href={downloadUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-14 px-8 rounded-[1.5rem] bg-[#0a3d62] hover:bg-primary flex items-center justify-center text-white transition-all active:scale-95 shrink-0 gap-3"
                    >
                      <Download className="w-5 h-5" />
                      <span className="font-black text-xs uppercase hidden sm:inline">DESCARGAR</span>
                    </a>
                  ) : (
                    <div className="h-14 w-14 rounded-[1.5rem] bg-gray-100 flex items-center justify-center text-gray-300">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No hay planos individuales registrados</p>
              </div>
            )}

            {obra.driveFolderUrl && (
              <a 
                href={obra.driveFolderUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full p-8 rounded-[3rem] bg-[#0a3d62] text-white shadow-2xl mt-6 border-l-[15px] border-primary transition-all active:scale-95 flex items-center"
              >
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mr-6 shrink-0">
                  <FolderOpen className="w-7 h-7 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-black uppercase text-xl leading-none">REPOSITORIO COMPLETO</p>
                  <p className="text-[10px] opacity-60 uppercase font-black mt-1">Sincronizado con Google Drive</p>
                </div>
                <ChevronRight className="w-8 h-8 opacity-20" />
              </a>
            )}
          </div>
        </div>
      </main>

      <footer className="p-12 text-center mt-auto">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">
          TAMER INDUSTRIAL S.A. | v5.0.6
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest">Cargando...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
