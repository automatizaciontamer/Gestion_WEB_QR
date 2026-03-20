
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

function A5Poster({ obra, qrImageSrc }: { obra: Obra, qrImageSrc: string }) {
  return (
    <div className="bg-white mx-auto border overflow-hidden w-[138mm] h-[195mm] p-0 flex flex-col font-sans shrink-0 border-gray-300">
      <div className="bg-[#0a3d62] text-white py-6 px-4 text-center">
        <h1 className="text-2xl font-black tracking-widest uppercase mb-1">TAMER INDUSTRIAL S.A.</h1>
        <p className="text-[10px] font-bold opacity-80 tracking-[0.2em]">DOCUMENTACIÓN TÉCNICA v5.2.0</p>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col items-center">
        <div className="w-full space-y-6 text-center mb-6">
          <div className="space-y-1">
            <p className="text-[#0a3d62] font-black text-xs uppercase tracking-[0.3em]">PROYECTO DE INGENIERÍA</p>
            <h2 className="text-xl font-black uppercase leading-tight border-b-2 border-[#0a3d62] inline-block pb-1 px-4 truncate max-w-[120mm]">{obra.nombreObra}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-left pt-2">
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 font-bold text-[9px] uppercase mb-1">O.F.</p>
                <p className="text-sm font-black text-gray-800">{obra.numeroOF}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[9px] uppercase mb-1">CLIENTE / RAZÓN SOCIAL</p>
                <p className="text-sm font-black text-gray-800 truncate pr-2">{obra.cliente}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 font-bold text-[9px] uppercase mb-1">O.T.</p>
                <p className="text-sm font-black text-gray-800">{obra.numeroOT}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[9px] uppercase mb-1">CÓDIGO INTERNO</p>
                <p className="text-sm font-black text-gray-800 truncate">{obra.codigoCliente}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full my-4">
          <div className="border-[8px] border-[#0a3d62] p-4 bg-white shadow-sm">
            {qrImageSrc ? (
              <img 
                src={qrImageSrc} 
                alt="QR Code Industrial" 
                className="w-[140px] h-[140px]"
              />
            ) : (
              <div className="w-[140px] h-[140px] flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </div>
          <p className="mt-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center max-w-[200px]">
            ESCANEE PARA ACCESO A LA CARPETA TÉCNICA
          </p>
        </div>
      </div>

      <div className="bg-[#0a3d62] text-white py-4 px-6 text-center mt-auto">
        <p className="text-xs font-bold leading-tight uppercase tracking-tighter">
          ACCESO EXCLUSIVO PARA PERSONAL DE OBRA
        </p>
        <p className="text-[8px] mt-1 opacity-60 font-black uppercase tracking-widest">Cloud Tamer | v5.2.0</p>
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
    window.print();
  };

  const qrImageSrc = qrUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=0a3d62`
    : '';

  return (
    <div className="space-y-6 print:space-y-0 w-full mx-auto pb-20 print:pb-0">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="flex flex-col gap-4 print:hidden px-4 lg:px-0 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 font-black uppercase tracking-widest text-xs text-[#0a3d62] w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver al Listado
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleCopyLink} variant="outline" className="gap-2 rounded-xl h-12 px-6 font-black border-primary text-primary">
              <Copy className="w-4 h-4" /> COPIAR LINK
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-xl h-12 px-6 font-black shadow-lg shadow-[#0a3d62]/20">
              <Printer className="w-4 h-4" /> IMPRIMIR FICHA A5 (DUPLICADA)
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 print:gap-4 print:w-[287mm] print:h-[195mm] print:flex-row mx-auto">
         <div className="shadow-2xl print:shadow-none bg-white">
           <A5Poster obra={obra} qrImageSrc={qrImageSrc} />
         </div>
         <div className="shadow-2xl print:shadow-none bg-white hidden print:block lg:block">
           <A5Poster obra={obra} qrImageSrc={qrImageSrc} />
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
