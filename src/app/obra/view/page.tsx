
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
  Info,
  ArrowLeft
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

  // Lógica de archivos robusta
  const files = useMemo(() => {
    if (!obra) return [];
    const source = obra.files || (obra as any).archivos || [];
    return Array.isArray(source) ? source : [];
  }, [obra]);

  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra?.driveFolderUrl;

  const getDownloadUrl = (file: any) => {
    if (!file) return '#';
    const fileId = file.id || (typeof file === 'string' ? file : '');
    if (!fileId) return '#';
    if (fileId.startsWith('http')) return fileId;
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  };

  const getFileName = (file: any, index: number) => {
    if (typeof file === 'string') {
      return `Documento Técnico ${index + 1}`;
    }
    return file.name || `Plano de Obra ${index + 1}`;
  };

  if (docLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Conectando con Servidor de Ingeniería v5.0...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Proyecto no encontrado</h1>
          <p className="text-xs font-bold text-muted-foreground mt-4">El ID no es válido o la obra fue removida del sistema.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8 uppercase tracking-widest">IR AL INICIO</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-[#0a3d62] text-white py-10 px-6 border-b-8 border-primary shadow-2xl relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-7 h-7" />
                )}
               </div>
               <div className="overflow-hidden">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Documentación Técnica</p>
                 <h2 className="text-sm font-black truncate max-w-[200px] uppercase">{empresa?.nombre || 'TAMER INDUSTRIAL'}</h2>
               </div>
             </div>
             <Button variant="outline" onClick={() => router.push('/login')} className="text-white border-white/20 hover:bg-white/10 rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest">
               <ArrowLeft className="w-4 h-4 mr-2" /> ACCESO
             </Button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight tracking-tighter break-words drop-shadow-md">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3">
              <span className="bg-primary text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-lg">OF: {obra.numeroOF}</span>
              <span className="bg-white/10 text-white text-[11px] font-black px-4 py-2 rounded-xl border border-white/10">OT: {obra.numeroOT}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-10 space-y-10 relative z-0">
        <div className="bg-white rounded-[2.5rem] shadow-xl border p-8 flex flex-col sm:flex-row justify-between gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Cliente / Razón Social</p>
            <p className="font-black text-xl text-[#0a3d62] uppercase leading-none">{obra.cliente}</p>
          </div>
          <div className="sm:text-right space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Localización</p>
            <p className="font-bold text-[#0a3d62] text-sm uppercase">{obra.direccion || 'Sin dirección registrada'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" /> PLANOS Y DOCUMENTOS v5.0
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {hasFiles ? files.map((file, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-md border hover:border-primary/50 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-5 overflow-hidden">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0 shadow-sm">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-[#0a3d62] text-sm uppercase truncate max-w-[250px]">{getFileName(file, idx)}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Sincronizado v5.0</p>
                  </div>
                </div>
                <Button asChild className="h-14 w-14 rounded-2xl bg-[#0a3d62] hover:bg-primary shadow-lg shrink-0 transition-transform active:scale-90">
                  <a href={getDownloadUrl(file)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-6 h-6" />
                  </a>
                </Button>
              </div>
            )) : !hasFolderUrl && (
              <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h4 className="font-black text-[#0a3d62] uppercase text-xs tracking-widest">Documentación en Proceso</h4>
                <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">
                  Contacte con la oficina técnica mencionando la OF: {obra.numeroOF}
                </p>
              </div>
            )}

            {hasFolderUrl && (
              <Button asChild className="w-full h-auto p-8 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/95 text-white shadow-2xl mt-6 border-l-[12px] border-primary transition-all active:scale-[0.98]">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mr-5 shrink-0">
                    <FolderOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-black uppercase text-xl leading-none tracking-tighter">ACCEDER AL REPOSITORIO COMPLETO</p>
                    <p className="text-[10px] opacity-60 uppercase font-black mt-2 tracking-widest">Abrir carpeta de planos en Google Drive</p>
                  </div>
                  <ChevronRight className="w-8 h-8 opacity-20 ml-2 shrink-0" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-blue-50/70 p-8 rounded-[2rem] border border-blue-100 flex items-start gap-5 shadow-sm">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Aviso Técnico de Obra</p>
            <p className="text-[10px] font-bold text-blue-800/80 uppercase leading-relaxed">
              La documentación visualizada corresponde a la revisión vigente. 
              Cualquier modificación debe ser solicitada a la oficina técnica central de Tamer Industrial S.A.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center mt-auto">
        <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.5em]">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | GESTIÓN CLOUD v5.0
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground">Sincronizando Planos v5.0...</p>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
