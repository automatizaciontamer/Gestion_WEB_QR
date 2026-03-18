
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
  MapPin, 
  Loader2,
  AlertCircle,
  FolderOpen,
  ChevronRight,
  Info,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

  if (docLoading && !obra) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Iniciando Visor Directo v4.5...</p>
      </div>
    );
  }

  if (!id || (!obra && !docLoading)) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <Card className="p-10 max-w-sm w-full border-none shadow-2xl rounded-[3rem] text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8">VOLVER AL INICIO</Button>
        </Card>
      </div>
    );
  }

  const files = obra.files || [];
  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra.driveFolderUrl;

  const getDownloadUrl = (file: any) => {
    if (!file) return '#';
    const fileId = typeof file === 'string' ? file : file.id;
    if (!fileId) return '#';
    if (fileId.startsWith('http')) return fileId;
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Cabecera v4.5 - Sin Solapamientos */}
      <header className="bg-[#0a3d62] text-white p-6 sm:p-12 w-full">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shrink-0">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-6 h-6" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Acceso Directo v4.5</p>
                <h2 className="text-[8px] font-bold text-white/40 uppercase truncate">{empresa?.nombre || 'Tamer Industrial S.A.'}</h2>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.push('/login')} className="text-white border border-white/20 rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 no-print">
              <ArrowLeft className="w-4 h-4 mr-2" /> PANEL
            </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black uppercase leading-tight text-white break-words">
              {obra.nombreObra}
            </h1>
            <div className="flex flex-wrap gap-2">
              <div className="bg-primary text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase shadow-lg shadow-primary/20">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase border border-white/10">OT: {obra.numeroOT}</div>
              <div className="bg-white/10 text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase border border-white/10">{obra.codigoCliente}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 flex-1">
        <section className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1">Cliente:</p>
              <p className="font-black text-[#0a3d62] text-lg uppercase leading-tight">{obra.cliente}</p>
            </div>
            <div className="p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1">Ubicación:</p>
              <p className="font-bold text-[#0a3d62] text-xs leading-tight uppercase">
                {obra.direccion || 'Consultar Dirección en Oficina Técnica'}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.5em] flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> DOCUMENTACIÓN TÉCNICA
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {hasFiles && files.map((file, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex items-center justify-between gap-4 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#0a3d62] text-base truncate uppercase">{file.name || `Plano ${idx + 1}`}</p>
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">Sincronizado Cloud</p>
                  </div>
                </div>
                <Button asChild className="h-12 w-12 rounded-xl bg-[#0a3d62] hover:bg-primary shadow-lg shrink-0">
                  <a href={getDownloadUrl(file)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-5 h-5" />
                  </a>
                </Button>
              </div>
            ))}

            {hasFolderUrl && (
              <Button asChild className="w-full h-auto p-6 rounded-[2rem] bg-[#0a3d62] hover:bg-[#0a3d62]/95 font-black text-lg gap-6 shadow-2xl mt-4 border-l-8 border-primary group transition-all active:scale-[0.98]">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  <FolderOpen className="w-8 h-8 text-primary shrink-0" />
                  <div className="text-left flex-1 ml-4">
                    <p className="uppercase tracking-tight leading-none text-white text-xl">REPOSITORIO DRIVE</p>
                    <p className="text-[9px] opacity-60 font-black tracking-widest uppercase mt-1">Acceso Completo a la Carpeta de Planos</p>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-40 group-hover:translate-x-1 transition-transform shrink-0" />
                </a>
              </Button>
            )}

            {!hasFiles && !hasFolderUrl && (
              <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-black text-[#0a3d62] uppercase text-[10px] tracking-widest">Sin Archivos Vinculados</h4>
                <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase">Contacte con la oficina técnica.</p>
              </div>
            )}
          </div>
        </div>

        <section className="bg-blue-50/50 p-6 rounded-[1.5rem] border border-blue-100 flex items-start gap-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Soporte Técnico</p>
            <p className="text-[9px] font-bold text-blue-700/70 leading-relaxed uppercase">
              Para inconsistencias en la documentación, mencione la OF: {obra.numeroOF}.
            </p>
          </div>
        </section>
      </main>

      <footer className="p-8 text-center bg-white border-t mt-auto">
        <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | v4.5
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-black uppercase text-[10px] tracking-widest">Cargando Visor v4.5...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
