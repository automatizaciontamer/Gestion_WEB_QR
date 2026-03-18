
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
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();
  const { empresa, logout, isUser } = useAuth();
  const router = useRouter();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading: docLoading } = useDoc<Obra>(obraDocRef);

  // Lógica de archivos ultra-robusta (v4.5.2)
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
      {/* Cabecera v4.5.2 - Sin solapamientos */}
      <header className="bg-[#0a3d62] text-white py-8 px-6 border-b-4 border-primary shadow-xl">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-6 h-6" />
                )}
               </div>
               <div>
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Gestión de Obras</p>
                 <h2 className="text-xs font-black truncate max-w-[150px]">{empresa?.nombre || 'TAMER INDUSTRIAL'}</h2>
               </div>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => router.push('/login')} className="text-white border-white/20 hover:bg-white/10 rounded-xl h-10 px-4 font-black text-[9px] uppercase tracking-widest">
                 <ArrowLeft className="w-3.5 h-3.5 mr-2" /> ACCESO
               </Button>
               {isUser && (
                 <Button variant="ghost" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl h-10 px-4 font-black text-[9px] uppercase tracking-widest">
                   <LogOut className="w-3.5 h-3.5 mr-2" /> SALIR
                 </Button>
               )}
             </div>
          </div>
          
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight break-words">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg">OF: {obra.numeroOF}</span>
              <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/10">OT: {obra.numeroOT}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-8 space-y-8">
        {/* Datos de Cliente */}
        <div className="bg-white rounded-[2rem] shadow-lg border p-6 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <p className="text-[9px] font-black uppercase text-primary mb-1 tracking-widest">Cliente</p>
            <p className="font-black text-lg text-[#0a3d62] uppercase leading-tight">{obra.cliente}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[9px] font-black uppercase text-primary mb-1 tracking-widest">Ubicación</p>
            <p className="font-bold text-[#0a3d62] text-xs uppercase">{obra.direccion || 'Sin dirección registrada'}</p>
          </div>
        </div>

        {/* Listado de Documentación */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" /> DOCUMENTACIÓN TÉCNICA v4.5.2
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {hasFiles ? files.map((file, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border hover:border-primary/30 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-[#0a3d62] text-sm uppercase truncate max-w-[200px]">{getFileName(file, idx)}</p>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Sincronizado</p>
                  </div>
                </div>
                <Button asChild className="h-12 w-12 rounded-xl bg-[#0a3d62] hover:bg-primary shrink-0">
                  <a href={getDownloadUrl(file)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-5 h-5" />
                  </a>
                </Button>
              </div>
            )) : !hasFolderUrl && (
              <div className="bg-white p-10 rounded-[2.5rem] text-center border-4 border-dashed border-slate-50">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h4 className="font-black text-[#0a3d62] uppercase text-xs">Sin Archivos Vinculados</h4>
                <p className="text-[9px] text-muted-foreground font-bold mt-2 uppercase">
                  Contacte con la oficina técnica mencionando la OF: {obra.numeroOF}
                </p>
              </div>
            )}

            {hasFolderUrl && (
              <Button asChild className="w-full h-auto p-6 rounded-[2rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 text-white shadow-xl mt-4 border-l-[10px] border-primary transition-all">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <FolderOpen className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-black uppercase text-lg leading-none tracking-tight">VER REPOSITORIO COMPLETO</p>
                    <p className="text-[9px] opacity-60 uppercase font-black mt-2">Abrir carpeta de planos en Google Drive</p>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-30 ml-2 shrink-0" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
          <div>
            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Aviso Técnico</p>
            <p className="text-[9px] font-bold text-blue-800/70 uppercase leading-relaxed">
              La documentación visualizada es la revisión oficial vigente. 
              Queda prohibido el uso de planos sin firma de aprobación final.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center mt-auto">
        <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | v4.5.2
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
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground">Cargando documentación...</p>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
