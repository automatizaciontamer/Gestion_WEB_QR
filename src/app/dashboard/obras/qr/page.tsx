"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download, Loader2, AlertCircle } from 'lucide-react';
import { useMemo, Suspense, useEffect, useState } from 'react';
import { Obra } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

function QRPosterContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const db = useFirestore();
  const [qrUrl, setQrUrl] = useState('');

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      // URL de la página pública de visualización
      const baseUrl = window.location.origin;
      setQrUrl(`${baseUrl}/obra/view?id=${id}`);
    }
  }, [id]);

  if (!id) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Falta identificación de la obra</h2>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Generando ficha técnica...</p>
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

  // Generador de QR simple usando API pública
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=0a3d62`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Panel de Control
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2 bg-[#0a3d62] hover:bg-[#0a3d62]/90">
            <Printer className="w-4 h-4" /> Imprimir Ficha A4
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-2xl mx-auto border overflow-hidden w-[210mm] min-h-[297mm] p-0 flex flex-col font-sans">
        <div className="bg-[#0a3d62] text-white py-12 px-8 text-center">
          <h1 className="text-4xl font-black tracking-widest uppercase mb-2">TAMER INDUSTRIAL S.A.</h1>
          <p className="text-sm font-bold opacity-80 tracking-[0.2em]">SISTEMA DE GESTIÓN TÉCNICA Y PLANOS</p>
        </div>

        <div className="flex-1 px-16 py-12 flex flex-col items-center">
          <div className="w-full space-y-10 text-center mb-12">
            <div className="space-y-2">
              <p className="text-[#0a3d62] font-black text-sm uppercase tracking-[0.3em]">IDENTIFICACIÓN DE OBRA</p>
              <h2 className="text-4xl font-black uppercase leading-tight border-b-4 border-[#0a3d62] inline-block pb-2 px-8">{obra.nombreObra}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-12 text-left pt-6">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 font-bold text-xs uppercase mb-1">ORDEN DE FABRICACIÓN (OF)</p>
                  <p className="text-2xl font-black text-gray-800">{obra.numeroOF}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-xs uppercase mb-1">CLIENTE</p>
                  <p className="text-2xl font-black text-gray-800">{obra.cliente}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 font-bold text-xs uppercase mb-1">ORDEN DE TRABAJO (OT)</p>
                  <p className="text-2xl font-black text-gray-800">{obra.numeroOT}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-xs uppercase mb-1">CÓDIGO DE CLIENTE</p>
                  <p className="text-2xl font-black text-gray-800">{obra.codigoCliente}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full my-6">
            <div className="border-[15px] border-[#0a3d62] p-8 bg-white shadow-xl">
              <img 
                src={qrImageSrc} 
                alt="QR Code" 
                className="w-[300px] h-[300px]"
              />
            </div>
            <p className="mt-8 text-sm font-black text-gray-400 uppercase tracking-widest">ESCANEE PARA VER DOCUMENTACIÓN Y PLANOS</p>
          </div>
        </div>

        <div className="bg-[#0a3d62] text-white py-10 px-12 text-center">
          <p className="text-xl font-bold leading-tight">
            ACCESO EXCLUSIVO PARA PERSONAL AUTORIZADO Y CLIENTES
          </p>
          <p className="text-xs mt-2 opacity-60">Soporte técnico: tamer.com.ar | {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

export default function QRPosterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando aplicación de impresión...</div>}>
      <QRPosterContent />
    </Suspense>
  );
}
