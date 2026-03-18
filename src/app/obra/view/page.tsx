
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

  // Lógica de archivos ultra-robusta (v4.5.2)
  // Busca en 'files', en 'archivos' (español) y maneja tanto arrays de objetos como de strings
  const files = useMemo(() => {
    if (!obra) return [];
    const source = obra.files || (obra as any).archivos || [];
    return Array.isArray(source) ? source : [];
  }, [obra]);

  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra?.driveFolderUrl;

  const getDownloadUrl = (file: any) => {
    if (!file) return '#';
    // Si es un objeto con ID, o un string directo (URL o ID)
    const fileId = file.id || (typeof file === 'string' ? file : '');
    if (!fileId) return '#';
    if (fileId.startsWith('http')) return fileId;
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  };

  const getFileName = (file: any, index: number) => {
    if (typeof file === 'string') {
      // Si es una URL, intentar extraer algo del final o poner genérico
      return `Documento Técnico ${index + 1}`;
    }
    return file.name || `Plano de Obra ${index + 1}`;
  };

  if (docLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Conectando con Servidor de Ingeniería...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <p className="text-xs font-bold text-muted-foreground mt-4">El ID del proyecto no es válido o ha sido eliminado.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8">IR AL INICIO</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      {/* Cabecera Estática sin solapamientos */}
      <header className="bg-[#0a3d62] text-white py-10 px-6 border-b-4 border-primary">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-7 h-7" />
                )}
               </div>
               <div className="overflow-hidden">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Sistema de Gestión de Obras</p>
                 <h2 className="text-sm font-black truncate">{empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}</h2>
               </div>
             </div>
             <Button variant="outline" onClick={() => router.push('/login')} className="text-white border-white/20 hover:bg-white/10 rounded-xl h-10 font-black text-[9px] uppercase tracking-widest shrink-0">
               <ArrowLeft className="w-3.5 h-3.5 mr-2" /> ACCESO
             </Button>
          </div>
          
          <div className="pt-2">
            <h1 className="text-3xl font-black uppercase leading-tight tracking-tight">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-primary text-white text-[11px] font-black px-4 py-1.5 rounded-lg shadow-lg">
                OF: {obra.numeroOF}
              </div>
              <div className="bg-white/10 text-white text-[11px] font-black px-4 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                OT: {obra.numeroOT}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-10 space-y-10">
        {/* Información de Cliente y Ubicación */}
        <section className="bg-white rounded-[2.5rem] shadow-xl border p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">Cliente Autorizado</p>
            <p className="font-black text-xl text-[#0a3d62] uppercase leading-tight">{obra.cliente}</p>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">Ubicación del Proyecto</p>
            <p className="font-bold text-[#0a3d62] text-sm uppercase leading-relaxed">
              {obra.direccion || 'Consultar con el jefe de obra asignado'}
            </p>
          </div>
        </section>

        {/* Listado de Documentación Técnica */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" /> DOCUMENTACIÓN TÉCNICA
            </h3>
            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">v4.5.2</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {hasFiles ? files.map((file, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-primary/20 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-5 overflow-hidden">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-[#0a3d62] text-sm uppercase truncate max-w-[250px]">{getFileName(file, idx)}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Sincronizado con Cloud Drive</p>
                  </div>
                </div>
                <Button asChild className="h-14 w-14 rounded-2xl bg-[#0a3d62] hover:bg-primary shadow-xl shadow-[#0a3d62]/20 shrink-0">
                  <a href={getDownloadUrl(file)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-6 h-6" />
                  </a>
                </Button>
              </div>
            )) : !hasFolderUrl && (
              <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h4 className="font-black text-[#0a3d62] uppercase text-sm">Archivos no vinculados aún</h4>
                <p className="text-[10px] text-muted-foreground font-bold mt-3 uppercase tracking-wider">
                  Contacte con la oficina técnica central mencionando la OF: {obra.numeroOF}
                </p>
              </div>
            )}

            {hasFolderUrl && (
              <Button asChild className="w-full h-auto p-8 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 text-white shadow-2xl mt-6 border-l-[12px] border-primary transition-all active:scale-[0.98]">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-6 shrink-0">
                    <FolderOpen className="w-9 h-9 text-primary" />
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-black uppercase text-xl leading-none tracking-tight">ACCEDER A REPOSITORIO COMPLETO</p>
                    <p className="text-[10px] opacity-60 uppercase font-black mt-2 tracking-widest">Abrir carpeta de planos certificados en Google Drive</p>
                  </div>
                  <ChevronRight className="w-8 h-8 opacity-30 ml-4 shrink-0" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Aviso de Seguridad y Validez */}
        <div className="bg-blue-50/50 p-8 rounded-[2rem] border-2 border-blue-100 flex items-start gap-6">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-[0.2em] mb-2">Aviso de Validez Técnica</p>
            <p className="text-[10px] font-bold text-blue-800/80 uppercase leading-relaxed">
              La documentación visualizada en este portal es la revisión oficial vigente para ejecución en obra. 
              Queda prohibido el uso de planos impresos sin firma de aprobación final.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center mt-auto border-t bg-white/30 backdrop-blur-sm">
        <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | GESTIÓN TÉCNICA v4.5.2
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
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Cloud Drive...</p>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
