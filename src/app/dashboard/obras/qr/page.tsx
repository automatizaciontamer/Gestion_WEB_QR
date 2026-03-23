
"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, AlertCircle, Info, Copy, ExternalLink } from 'lucide-react';
import { useMemo, Suspense, useEffect, useState } from 'react';
import { Obra } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

function A6Poster({ obra, qrImageSrc }: { obra: Obra, qrImageSrc: string }) {
  return (
    <div className="bg-white mx-auto border overflow-hidden w-[105mm] h-[148mm] print:w-[105mm] print:h-[148mm] p-0 flex flex-col font-sans shrink-0 border-gray-300">

      <div className="bg-[#0a3d62] text-white py-3 px-2 text-center">
        <h1 className="text-sm font-black tracking-widest uppercase mb-0.5">TAMER INDUSTRIAL S.A.</h1>
        <p className="text-[7px] font-bold opacity-80 tracking-[0.2em]">DOCUMENTACIÓN TÉCNICA v5.2.0</p>
      </div>


      <div className="px-4 py-3 flex flex-col items-center">
        <div className="w-full space-y-1 text-center mb-2">
          <p className="text-[#0a3d62] font-black text-[8px] uppercase tracking-[0.3em]">PROYECTO DE INGENIERÍA</p>
          <h2 className="text-xs font-black uppercase border-b-2 border-[#0a3d62] inline-block pb-0.5 px-2 truncate max-w-[90mm]">{obra.nombreObra}</h2>
        </div>

          
          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            <div className="space-y-1.5">
              <div>
                <p className="text-gray-400 font-bold text-[6px] uppercase mb-0.5">O.F.</p>
                <p className="text-[10px] font-black text-gray-800 leading-none">{obra.numeroOF}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[6px] uppercase mb-0.5">CLIENTE</p>
                <p className="text-[10px] font-black text-gray-800 leading-none truncate pr-1">{obra.cliente}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-gray-400 font-bold text-[6px] uppercase mb-0.5">O.T.</p>
                <p className="text-[10px] font-black text-gray-800 leading-none">{obra.numeroOT}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[6px] uppercase mb-0.5">CÓDIGO</p>
                <p className="text-[10px] font-black text-gray-800 leading-none truncate">{obra.codigoCliente}</p>
              </div>
            </div>
          </div>
        </div>


        <div className="flex-1 flex flex-col items-center justify-center w-full my-2">
          <div className="border-[4px] border-[#0a3d62] p-1 bg-white shadow-sm">
            {qrImageSrc ? (
              <img 
                src={qrImageSrc} 
                alt="QR Code Industrial" 
                className="w-[80mm] h-[80mm] print:w-[80mm] print:h-[80mm]"
              />
            ) : (
              <div className="w-[80mm] h-[80mm] flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </div>
          <p className="mt-2 text-[6px] font-black text-gray-400 uppercase tracking-widest text-center">
            ESCANEE PARA ACCESO A CARPETA TÉCNICA
          </p>
        </div>



      <div className="bg-[#0a3d62] text-white py-2 px-2 text-center mt-auto">
        <p className="text-[8px] font-bold uppercase tracking-tighter">
          ACCESO EXCLUSIVO PERSONAL DE OBRA
        </p>
        <p className="text-[5px] opacity-60 font-black uppercase tracking-widest">Cloud Tamer Industrial v5.2.0</p>
      </div>
    </div>
  );
}


function QRPosterContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [qrUrl, setQrUrl] = useState('');

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const baseUrl = window.location.origin;
      const targetUrl = `${baseUrl}/obra/view?id=${id}`;
      setQrUrl(targetUrl);
    }
  }, [id]);

  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    toast({
      title: "Enlace Copiado",
      description: "El link directo para el visor ha sido copiado satisfactoriamente.",
    });
  };

  if (!id) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Error: Falta ID de Obra</h2>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Generando Ficha Técnica v5.2.0...</p>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Obra no encontrada</h2>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    );
  }

  const handlePrint = () => {
    // Sugerir nombre de archivo para el PDF (v5.2.0)
    const originalTitle = document.title;
    document.title = `(${obra.codigoCliente || 'OBRA'}-${obra.numeroOF || 'OF'}-${obra.numeroOT || 'OT'})`;
    
    setTimeout(() => {
      window.print();
      // Restaurar título original después del diálogo de impresión
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 150);
  };


  const qrImageSrc = qrUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=0a3d62`
    : '';

  return (
    <div className="space-y-6 print:space-y-0 w-full mx-auto pb-20 print:pb-0">
      <style>{`
        @media print {
          @page { size: A6 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { width: 105mm; height: 148mm; overflow: hidden; }
        }
      `}</style>


      <div className="flex flex-col gap-4 print:hidden px-4 lg:px-0 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 font-black uppercase tracking-widest text-xs text-[#0a3d62] w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver al Listado
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <Button onClick={handleCopyLink} variant="outline" className="gap-2 rounded-xl h-12 px-4 sm:px-6 font-black border-primary text-primary w-full sm:w-auto">
              <Copy className="w-4 h-4" /> COPIAR LINK
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-xl h-12 px-4 sm:px-6 font-black shadow-lg shadow-[#0a3d62]/20 w-full sm:w-auto text-white">
              <Printer className="w-4 h-4" /> DESCARGAR/IMPRIMIR (A6)
            </Button>

          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 print:gap-0 print:block mx-auto">
         <div className="shadow-2xl print:shadow-none bg-white print-container">
           <A6Poster obra={obra} qrImageSrc={qrImageSrc} />
         </div>
      </div>

    </div>
  );
}


export default function QRPosterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black uppercase tracking-widest text-xs">Cargando aplicación de impresión...</div>}>
      <QRPosterContent />
    </Suspense>
  );
}
