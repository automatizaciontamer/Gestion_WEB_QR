
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

  // Lógica de descarga robusta para IDs de Drive o URLs completas
  const getDownloadUrl = (file: any) => {
    if (!file) return '#';
    const fileId = file.id || (typeof file === 'string' ? file : '');
    if (!fileId) return '#';
    if (fileId.startsWith('http')) return fileId;
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  };

  if (docLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Cargando Documentación Técnica...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8">VOLVER AL PANEL</Button>
        </div>
      </div>
    );
  }

  const files = obra.files || [];
  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra.driveFolderUrl;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-[#0a3d62] text-white p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-6 h-6" />
                )}
               </div>
               <div>
                 <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Visor de Ingeniería</p>
                 <h2 className="text-xs font-bold truncate max-w-[150px]">{empresa?.nombre || 'Tamer Industrial S.A.'}</h2>
               </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/login')} className="text-white border-white/20 hover:bg-white/10 rounded-xl h-10 font-black text-[10px] uppercase">
              <ArrowLeft className="w-4 h-4 mr-2" /> PANEL
            </Button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-md">OF: {obra.numeroOF}</span>
              <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1 rounded-md">OT: {obra.numeroOT}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-10 space-y-8">
        <section className="bg-white rounded-[2rem] shadow-md border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-primary mb-1">Cliente</p>
            <p className="font-black text-[#0a3d62] uppercase leading-tight">{obra.cliente}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-primary mb-1">Ubicación</p>
            <p className="font-bold text-[#0a3d62] text-xs uppercase leading-tight">
              {obra.direccion || 'Consultar con Oficina Técnica'}
            </p>
          </div>
        </section>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-[#0a3d62] uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> DOCUMENTACIÓN DISPONIBLE
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {hasFiles && files.map((file, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-[#0a3d62] text-sm uppercase truncate max-w-[200px]">{file.name || `Plano ${idx + 1}`}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Sincronizado Cloud</p>
                  </div>
                </div>
                <Button asChild className="h-10 w-10 rounded-xl bg-[#0a3d62] hover:bg-primary shadow-lg">
                  <a href={getDownloadUrl(file)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            ))}

            {hasFolderUrl && (
              <Button asChild className="w-full h-auto p-6 rounded-[2rem] bg-[#0a3d62] hover:bg-[#0a3d62]/90 text-white shadow-xl mt-4 border-l-4 border-primary transition-all active:scale-[0.98]">
                <a href={obra.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  <FolderOpen className="w-8 h-8 text-primary mr-4" />
                  <div className="text-left flex-1">
                    <p className="font-black uppercase text-lg leading-none">REPOSITORIO COMPLETO</p>
                    <p className="text-[9px] opacity-60 uppercase font-black mt-1">Acceder a la carpeta de planos en Drive</p>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-40" />
                </a>
              </Button>
            )}

            {!hasFiles && !hasFolderUrl && (
              <div className="bg-white p-10 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <h4 className="font-black text-[#0a3d62] uppercase text-xs">Sin archivos vinculados</h4>
                <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">Contacte con soporte mencionando la OF: {obra.numeroOF}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Aviso Técnico</p>
            <p className="text-[9px] font-bold text-blue-700 uppercase mt-1 leading-relaxed">
              La documentación visualizada corresponde a la última revisión aprobada en el sistema Tamer Cloud.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center mt-auto border-t bg-white/50">
        <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
          © {new Date().getFullYear()} TAMER INDUSTRIAL S.A. | GESTIÓN TÉCNICA v4.5.1
        </p>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-black uppercase text-[10px] tracking-widest">Iniciando Visor de Ingeniería...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
