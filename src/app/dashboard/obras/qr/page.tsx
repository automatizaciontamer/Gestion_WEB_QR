"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, AlertCircle } from 'lucide-react';
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
      // URL para el portal de descarga público
      // Aseguramos que el QR apunte al dominio del proyecto activo
      const baseUrl = "https://gestion-tamer-ind-s-a.web.app";
      setQrUrl(`${baseUrl}/obra/view?id=${id}`);
    }
  }, [id]);

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
        <p className="text-muted-foreground font-medium">Generando Ficha QR Industrial...</p>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Obra no encontrada en la base compartida</h2>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=0a3d62`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between no-print px-4 lg:px-0">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Panel de Control
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-xl h-12 px-6 font-bold shadow-lg shadow-[#0a3d62]/20">
            <Printer className="w-4 h-4" /> Imprimir A4
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-2xl mx-auto border overflow-hidden w-full max-w-[210mm] min-h-[297mm] p-0 flex flex-col font-sans">
        <div className="bg-[#0a3d62] text-white py-12 px-8 text-center">
          <h1 className="text-4xl font-black tracking-widest uppercase mb-2">TAMER INDUSTRIAL S.A.</h1>
          <p className="text-sm font-bold opacity-80 tracking-[0.2em]">DOCUMENTACIÓN TÉCNICA Y PLANOS</p>
        </div>

        <div className="flex-1 px-8 sm:px-16 py-12 flex flex-col items-center">
          <div className="w-full space-y-10 text-center mb-12">
            <div className="space-y-2">
              <p className="text-[#0a3d62] font-black text-sm uppercase tracking-[0.3em]">PROYECTO DE INGENIERÍA</p>
              <h2 className="text-2xl sm:text-4xl font-black uppercase leading-tight border-b-4 border-[#0a3d62] inline-block pb-2 px-8">{obra.nombreObra}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 text-left pt-6">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">ORDEN DE FABRICACIÓN (OF)</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-800">{obra.numeroOF}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">CLIENTE / RAZÓN SOCIAL</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-800 truncate">{obra.cliente}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">ORDEN DE TRABAJO (OT)</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-800">{obra.numeroOT}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">CÓDIGO INTERNO</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-800">{obra.codigoCliente}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full my-6">
            <div className="border-[10px] sm:border-[15px] border-[#0a3d62] p-4 sm:p-8 bg-white shadow-xl">
              <img 
                src={qrImageSrc} 
                alt="QR Code" 
                className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px]"
              />
            </div>
            <p className="mt-8 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest text-center">
              ESCANEE PARA VER PLANOS Y ARCHIVOS TÉCNICOS EN CAMPO
            </p>
          </div>
        </div>

        <div className="bg-[#0a3d62] text-white py-10 px-12 text-center">
          <p className="text-lg sm:text-xl font-bold leading-tight">
            ACCESO EXCLUSIVO PARA PERSONAL DE OBRA Y CLIENTES
          </p>
          <p className="text-[10px] mt-2 opacity-60">Sincronizado vía Cloud Firestore | tamer.com.ar</p>
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
