
"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, AlertCircle, Copy } from 'lucide-react';
import { useMemo, Suspense, useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Obra } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function A6Poster({ obra, qrImageSrc, posterRef }: { obra: Obra, qrImageSrc: string, posterRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={posterRef} className="bg-white mx-auto border overflow-hidden w-[105mm] h-[148mm] print:w-[105mm] print:h-[148mm] p-0 flex flex-col font-sans shrink-0 border-gray-300">

      <div className="bg-[#047857] text-white py-3 px-2 text-center">
        <h1 className="text-sm font-black tracking-widest uppercase mb-0.5">TAMER INDUSTRIAL S.A.</h1>
        <p className="text-[7px] font-bold opacity-80 tracking-[0.2em]">PORTAL DE CLIENTES v5.2.0</p>
      </div>


      <div className="px-4 py-3 flex flex-col items-center">
        <div className="w-full space-y-1 text-center mb-2">
          <p className="text-[#047857] font-black text-[8px] uppercase tracking-[0.3em]">INFORMACIÓN DE PROYECTO</p>
          <h2 className="text-xs font-black uppercase border-[#047857] block px-4 w-full break-words leading-tight">{obra.nombreObra}</h2>
          <div className="border-b-2 border-[#047857] w-24 mx-auto mt-1 opacity-50"></div>
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
          <div className="border-[4px] border-[#047857] p-1 bg-white shadow-sm">
            {qrImageSrc ? (
              <img 
                src={qrImageSrc} 
                alt="QR Code Cliente" 
                className="w-[80mm] h-[80mm] print:w-[80mm] print:h-[80mm]"
              />
            ) : (
              <div className="w-[80mm] h-[80mm] flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin text-emerald-600" />
              </div>
            )}
          </div>
          <p className="mt-2 text-[6px] font-black text-gray-400 uppercase tracking-widest text-center">
            ESCANEE PARA SUBIR DOCUMENTOS DE OBRA
          </p>
        </div>



      <div className="bg-[#047857] text-white py-2 px-3 text-center mt-auto min-h-[40px] flex flex-col justify-center">
        <p className="text-[8px] font-bold uppercase tracking-tighter">
          ACCESO EXCLUSIVO CLIENTES
        </p>
        <p className="text-[7px] font-black uppercase tracking-tight mt-1 leading-tight break-words">
          {obra.nombreObra}
        </p>
        <p className="text-[5px] opacity-60 font-black uppercase tracking-widest mt-1.5">Cloud Tamer Industrial v5.2.0</p>
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
  const posterRef = useRef<HTMLDivElement>(null);

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id) as any;
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const baseUrl = window.location.origin;
      const targetUrl = `${baseUrl}/obra/client-upload?id=${id}`;
      setQrUrl(targetUrl);
    }
  }, [id]);

  useEffect(() => {
    if (obra) {
      const fileName = `CLIENTE-(${obra.codigoCliente || 'OBRA'}-${obra.numeroOF || 'OF'}-${obra.numeroOT || 'OT'})`;
      document.title = fileName;
    }
  }, [obra]);


  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    toast({
      title: "Enlace Copiado",
      description: "El link directo para carga del cliente ha sido copiado satisfactoriamente.",
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
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Generando Ficha de Cliente v5.2.0...</p>
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


  const handlePrint = async () => {
    if (posterRef.current) {
        try {
            const dataUrl = await toPng(posterRef.current, { 
                quality: 1.0, 
                pixelRatio: 4, // High resolution
                backgroundColor: '#ffffff',
                skipFonts: true, // Prevents SecurityError from cross-origin stylesheets
                filter: (node) => {
                  // Skip link elements that reference external stylesheets
                  if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
                    try { node.sheet?.cssRules; } catch { return false; }
                  }
                  return true;
                },
            });
            const fileName = `CLIENTE-(${obra.codigoCliente || 'OBRA'}-${obra.numeroOF || 'OF'}-${obra.numeroOT || 'OT'}).png`;
            saveAs(dataUrl, fileName);
            
            toast({
              title: "Imagen Generada",
              description: "La versión PNG se ha descargado correctamente.",
            });
        } catch (err) {
            console.error('Error generating PNG:', err);
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo generar la imagen PNG.",
            });
        }
    }

    // Still trigger the PDF print dialog
    window.print();
  };

  const qrImageSrc = qrUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=047857`
    : '';

  return (
    <div className="space-y-6 print:space-y-0 w-full mx-auto pb-20 print:pb-0">
      <h1 className="sr-only">{`CLIENTE-(${obra.codigoCliente || 'OBRA'}-${obra.numeroOF || 'OF'}-${obra.numeroOT || 'OT'})`}</h1>
      <style>{`
        @media print {
          @page { size: A6 portrait; margin: 0; }
          html, body {
            width: 105mm;
            height: 148mm;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            width: 105mm !important;
            height: 148mm !important;
            overflow: hidden;
            margin: 0 auto;
          }
        }
      `}</style>


      <div className="flex flex-col gap-4 print:hidden px-4 lg:px-0 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 font-black uppercase tracking-widest text-xs text-[#047857] w-fit hover:bg-emerald-50">
            <ArrowLeft className="w-4 h-4" /> Volver al Listado
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <Button onClick={handleCopyLink} variant="outline" className="gap-2 rounded-xl h-12 px-4 sm:px-6 font-black border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 w-full sm:w-auto">
              <Copy className="w-4 h-4" /> COPIAR LINK CLIENTE
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-[#047857] hover:bg-[#065f46] rounded-xl h-12 px-4 sm:px-6 font-black shadow-lg shadow-[#047857]/20 w-full sm:w-auto text-white">
              <Printer className="w-4 h-4" /> DESCARGAR/IMPRIMIR (A6)
            </Button>

          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 print:gap-0 print:block mx-auto">
         <div className="shadow-2xl print:shadow-none bg-white print-container border-2 border-emerald-100">
           <A6Poster obra={obra} qrImageSrc={qrImageSrc} posterRef={posterRef} />
         </div>
      </div>

    </div>
  );
}


export default function QRClientePosterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black uppercase tracking-widest text-xs text-emerald-700">Cargando aplicación de impresión...</div>}>
      <QRPosterContent />
    </Suspense>
  );
}
