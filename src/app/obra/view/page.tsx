
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
    // Soporte para múltiples nombres de campo para máxima compatibilidad
    const source = obra.files || (obra as any).archivos || [];
    return Array.isArray(source) ? source : [];
  }, [obra]);

  const hasFiles = files.length > 0;
  const hasFolderUrl = !!obra?.driveFolderUrl;

  /**
   * Genera una URL de descarga directa de Google Drive v5.0.6
   * Extrae el ID de forma agresiva de cualquier formato de dato.
   */
  const getDownloadUrl = (file: any) => {
    if (!file) return '';
    let driveId = '';
    
    if (typeof file === 'string') {
      // Intentar extraer ID de una URL o cadena
      const match = file.match(/[-\w]{25,}/);
      driveId = match ? match[0] : file;
    } else if (typeof file === 'object') {
      // Buscar ID en propiedades comunes
      driveId = file.id || file.fileId || file.googleId || '';
      
      // Si no se encuentra, buscar cualquier propiedad que parezca un ID o URL
      if (!driveId) {
        for (const key in file) {
          const val = file[key];
          if (typeof val === 'string' && (val.includes('drive.google.com') || val.includes('id='))) {
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
    
    // Formato de descarga directa universal de Google Drive
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Planos v5.0.6...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="min-h-screen items-center justify-center p-6 bg-slate-50 flex">
        <div className="p-10 max-w-sm w-full bg-white shadow-2xl rounded-[3rem] text-center border">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive opacity-50" />
          <h1 className="font-black text-xl text-[#0a3d62] uppercase">Obra no encontrada</h1>
          <p className="text-xs font-bold text-muted-foreground mt-4">El ID no es válido o el registro no existe.</p>
          <Button onClick={() => router.push('/login')} className="w-full h-14 bg-[#0a3d62] rounded-2xl font-black mt-8 uppercase tracking-widest">VOLVER AL PANEL</Button>
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
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl overflow-hidden border-2 border-primary/20">
                {empresa?.logoUrl ? (
                  <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Construction className="text-[#0a3d62] w-7 h-7" />
                )}
               </div>
               <div className="overflow-hidden">
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">TAMER INDUSTRIAL S.A.</p>
                 <h2 className="text-xs font-black truncate max-w-[180px] uppercase opacity-60">Control Técnico v5.0.6</h2>
               </div>
             </div>
             <Button variant="ghost" onClick={() => router.push('/login')} className="text-white/40 hover:bg-white/10 rounded-xl h-10 px-4 font-black text-[9px] uppercase tracking-widest border border-white/10">
               <ArrowLeft className="w-3 h-3 mr-2" /> SALIR
             </Button>
          </div>
          
          <div className="space-y-4 pt-6">
            <h1 className="text-3xl sm:text-5xl font-black uppercase leading-tight tracking-tighter break-words drop-shadow-xl">{obra.nombreObra}</h1>
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary text-white text-[10px] font-black px-5 py-2.5 rounded-xl shadow-lg border border-primary/20">OF: {obra.numeroOF}</div>
              <div className="bg-white/10 text-white text-[10px] font-black px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm">OT: {obra.numeroOT}</div>
              <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-5 py-2.5 rounded-xl border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> PLANOS VERIFICADOS
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-12 space-y-12">
        <div className="bg-white rounded-[3rem] shadow-xl border p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Cliente Principal</p>
            <p className="font-black text-2xl text-[#0a3d62] uppercase leading-none">{obra.cliente}</p>
          </div>
          <div className="md:text-right space-y-2">
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Dirección de Instalación</p>
            <p className="font-bold text-[#0a3d62] text-sm uppercase">{obra.direccion || 'Ubicación de Obra Registrada'}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-black text-[#0a3d62] uppercase tracking-[0.4em] flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" /> Carpeta de Planos
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {hasFiles ? files.map((file, idx) => {
              const downloadUrl = getDownloadUrl(file);
              const fileName = getFileName(file, idx);
              return (
                <div key={idx} className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border hover:border-primary transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6 overflow-hidden">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0 shadow-sm border border-secondary">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-[#0a3d62] text-base uppercase truncate max-w-[180px] sm:max-w-[400px]">{fileName}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">PNG / JPG Sincronizado</p>
                    </div>
                  </div>
                  {downloadUrl ? (
                    <a 
                      href={downloadUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-16 px-8 rounded-[1.5rem] bg-[#0a3d62] hover:bg-primary shadow-xl flex items-center justify-center text-white transition-all active:scale-90 shrink-0 gap-3"
                    >
                      <Download className="w-6 h-6" />
                      <span className="font-black text-xs uppercase hidden sm:inline">DESCARGAR</span>
                    </a>
                  ) : (
                    <div className="h-16 w-16 rounded-[1.5rem] bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="bg-white p-16 rounded-[3rem] text-center border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <div>
                  <h4 className="font-black text-[#0a3d62] uppercase text-xs tracking-widest">Sin planos individuales</h4>
                  <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">Verifique el repositorio completo abajo</p>
                </div>
              </div>
            )}

            {hasFolderUrl && (
              <a 
                href={obra.driveFolderUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full h-auto p-10 rounded-[3rem] bg-[#0a3d62] hover:bg-[#0a3d62]/95 text-white shadow-2xl mt-6 border-l-[15px] border-primary transition-all active:scale-[0.98] flex items-center"
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-6 shrink-0">
                  <FolderOpen className="w-9 h-9 text-primary" />
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className="font-black uppercase text-2xl leading-none tracking-tighter">REPOSITORIO COMPLETO DE OBRA</p>
                  <p className="text-[11px] opacity-60 uppercase font-black mt-2 tracking-widest">Google Drive v5.0.6</p>
                </div>
                <ChevronRight className="w-10 h-10 opacity-20 ml-2 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="bg-blue-50/70 p-8 rounded-[2.5rem] border border-blue-200 flex items-start gap-6 shadow-sm">
          <Info className="w-7 h-7 text-blue-600 shrink-0 mt-1" />
          <div className="space-y-2">
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Guía de Visualización</p>
            <p className="text-[10px] font-bold text-blue-800/80 uppercase leading-relaxed">
              Los archivos se descargan directamente en su formato original. Si un plano no se visualiza, asegúrese de tener instalada una aplicación de visor de imágenes o PDF en su dispositivo móvil. OF: {obra.numeroOF}
            </p>
          </div>
        </div>
      </main>

      <footer className="p-12 text-center mt-auto">
        <div className="inline-block px-8 py-3 bg-secondary/60 rounded-full border border-secondary shadow-sm">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">
            TAMER INDUSTRIAL S.A. | v5.0.6 CLOUD
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
        <Loader2 className="w-14 h-14 animate-spin text-primary mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground">Estableciendo Conexión v5.0.6...</p>
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
