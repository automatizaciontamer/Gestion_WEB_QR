
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
  AlertCircle
} from 'lucide-react';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  const files = useMemo(() => {
    if (!obra) return [];
    return obra.files || [];
  }, [obra]);

  const getDownloadUrl = (file: any) => {
    if (!file) return '';
    // Extraer el ID de Google Drive de cualquier propiedad posible
    const driveId = file.id || file.fileId || (typeof file === 'string' ? file : '');
    if (!driveId || driveId.length < 5) return '';
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando...</p>
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
              <h2 className="text-xs font-black uppercase opacity-60">Visor Técnico de Obra</h2>
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
            <FileText className="w-6 h-6 text-primary" /> DOCUMENTACIÓN TÉCNICA
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {files.length > 0 ? files.map((file, idx) => {
              const downloadUrl = getDownloadUrl(file);
              return (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-md border hover:border-primary transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6 overflow-hidden">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-[#0a3d62] text-base uppercase truncate pr-4">{file.name || `Plano Técnico ${idx + 1}`}</p>
                    </div>
                  </div>
                  {downloadUrl && (
                    <a 
                      href={downloadUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-6 rounded-xl bg-[#0a3d62] hover:bg-primary flex items-center justify-center text-white transition-all active:scale-95 shrink-0 gap-3 font-black text-xs uppercase"
                    >
                      <Download className="w-4 h-4" /> DESCARGAR
                    </a>
                  )}
                </div>
              );
            }) : (
              <div className="bg-white p-12 rounded-[2rem] text-center border-4 border-dashed border-slate-100">
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">No hay planos registrados</p>
              </div>
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
