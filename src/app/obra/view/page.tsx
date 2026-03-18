
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, Suspense } from 'react';
import { Obra } from '@/lib/types';
import { 
  FileText, 
  Eye, 
  Construction, 
  Loader2,
  AlertCircle,
  FolderOpen,
  ChevronRight,
  Info,
  ArrowLeft,
  ShieldCheck,
  Download
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
    const source = obra.files || (obra as any).archivos || [];
    return Array.isArray(source) ? source : [];
  }, [obra]);

  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra?.driveFolderUrl;

  const getDriveViewUrl = (file: any) => {
    if (!file) return '';
    let fileId = '';
    if (typeof file === 'string') {
      fileId = file;
    } else {
      fileId = file.id || file.fileId || '';
    }
    
    if (!fileId) return '';
    if (fileId.startsWith('http')) return fileId;
    
    // Usamos el visor nativo de Google Drive para máxima compatibilidad (v5.0.5)
    return `https://drive.google.com/file/d/${fileId}/view`;
  };

  const getFileName = (file: any, index: number) => {
    if (typeof file === 'string') {
      return `Plano Técnico ${index + 1}`;
    }
    return file.name || `Documento ${index + 1}`;
  };

  if (docLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Planos v5.0.5...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <p className="text-xs font-bold text-muted-foreground mt-4">El ID no es válido o la obra fue removida.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8 uppercase tracking-widest">IR AL INICIO</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20">
      <header className="bg-[#0a3d62] text-white py-10 px-6 border-b-8 border-primary shadow-2xl relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl overflow-hidden">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-7 h-7" />
                )}
               </div>
               <div className="overflow-hidden">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">TAMER INDUSTRIAL S.A.</p>
                 <h2 className="text-xs font-black truncate max-w-[150px] uppercase opacity-80">v5.0.5 - Planos en Obra</h2>
               </div>
             </div>
             <Button variant="ghost" onClick={() => router.push('/login')} className="text-white/50 hover:bg-white/10 rounded-xl h-10 px-4 font-black text-[9px] uppercase tracking-widest">
               <ArrowLeft className="w-3 h-3 mr-2" /> ACCESO ADMIN
             </Button>
          </div>
          
          <div className="space-y-4 pt-4">
            <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight tracking-tighter break-words drop-shadow-md">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg border border-primary/20">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white text-[10px] font-black px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">OT: {obra.numeroOT}</div>
              <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-4 py-2 rounded-xl border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> VERIFICADO
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-10 space-y-10">
        <div className="bg-white rounded-[2.5rem] shadow-xl border p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Cliente</p>
            <p className="font-black text-xl text-[#0a3d62] uppercase leading-none">{obra.cliente}</p>
          </div>
          <div className="md:text-right space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Localización</p>
            <p className="font-bold text-[#0a3d62] text-sm uppercase">{obra.direccion || 'Ubicación Sincronizada'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" /> Documentación Técnica
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {hasFiles ? files.map((file, idx) => {
              const driveUrl = getDriveViewUrl(file);
              const fileName = getFileName(file, idx);
              return (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-md border hover:border-primary/50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-5 overflow-hidden">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0 shadow-sm border border-secondary">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-[#0a3d62] text-sm uppercase truncate max-w-[200px] sm:max-w-[400px]">{fileName}</p>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Archivo de Ingeniería</p>
                    </div>
                  </div>
                  {driveUrl ? (
                    <a 
                      href={driveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-14 px-6 rounded-2xl bg-[#0a3d62] hover:bg-primary shadow-lg flex items-center justify-center text-white transition-transform active:scale-95 shrink-0 gap-3"
                    >
                      <Eye className="w-5 h-5" />
                      <span className="font-black text-xs uppercase hidden sm:inline">VER / BAJAR</span>
                    </a>
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-12 h-12 text-slate-200" />
                <div>
                  <h4 className="font-black text-[#0a3d62] uppercase text-xs tracking-widest">Sin archivos individuales</h4>
                  <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">Use el botón de repositorio completo</p>
                </div>
              </div>
            )}

            {hasFolderUrl && (
              <a 
                href={obra.driveFolderUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full h-auto p-8 rounded-[2.5rem] bg-[#0a3d62] hover:bg-[#0a3d62]/95 text-white shadow-2xl mt-4 border-l-[12px] border-primary transition-all active:scale-[0.98] flex items-center"
              >
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mr-5 shrink-0">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className="font-black uppercase text-xl leading-none tracking-tighter">REPOSITORIO DE PLANOS COMPLETO</p>
                  <p className="text-[10px] opacity-60 uppercase font-black mt-2 tracking-widest">Acceso Directo Google Drive v5.0.5</p>
                </div>
                <ChevronRight className="w-8 h-8 opacity-20 ml-2 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="bg-blue-50/70 p-8 rounded-[2rem] border border-blue-100 flex items-start gap-5 shadow-sm">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div className="space-y-2">
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Aviso de Documentación</p>
            <p className="text-[10px] font-bold text-blue-800/80 uppercase leading-relaxed">
              El botón "VER / BAJAR" abrirá el visor oficial de Google Drive para garantizar que los planos se descarguen en el formato original (PNG/JPG) sin errores de sincronización. OF: {obra.numeroOF}
            </p>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center mt-auto">
        <div className="inline-block px-6 py-2 bg-secondary/50 rounded-full border">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">
            TAMER INDUSTRIAL S.A. | GESTIÓN DE PLANOS v5.0.5
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground">Cargando Documentación...</p>
      </div>
    }>
      <Suspense fallback={null}>
        <ObraViewContent />
      </Suspense>
    </Suspense>
  );
}
