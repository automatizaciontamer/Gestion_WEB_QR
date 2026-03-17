"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Obra } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

// Requerido para exportación estática con rutas dinámicas en Next.js
export function generateStaticParams() {
  return []; // Las páginas se generarán bajo demanda en el cliente o mediante rewrites
}

export default function QRPosterPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const db = useFirestore();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id as string);
  }, [db, id]);

  const { data: obra, loading } = useDoc<Obra>(obraDocRef);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Cargando datos de la obra...</p>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold">Obra no encontrada</h2>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Descargar PDF
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-[#0a3d62] hover:bg-[#0a3d62]/90">
            <Printer className="w-4 h-4" /> Imprimir Poster (A4)
          </Button>
        </div>
      </div>

      {/* Poster A4 Content */}
      <div className="bg-white shadow-2xl mx-auto border overflow-hidden w-[210mm] min-h-[297mm] p-0 flex flex-col font-sans">
        {/* Header */}
        <div className="bg-[#0a3d62] text-white py-10 px-8 text-center">
          <h1 className="text-4xl font-black tracking-widest uppercase">TAMER INDUSTRIAL S.A.</h1>
        </div>

        {/* Content */}
        <div className="flex-1 px-12 py-12 flex flex-col items-center">
          <div className="w-full space-y-8 text-center mb-12">
            <div className="space-y-1">
              <p className="text-gray-500 font-bold text-lg uppercase tracking-wider">OBRA</p>
              <h2 className="text-3xl font-black uppercase leading-tight">{obra.nombreObra}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 font-bold text-sm uppercase">NÚMERO OF</p>
                  <p className="text-xl font-black">{obra.numeroOF}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-sm uppercase">CLIENTE</p>
                  <p className="text-xl font-black">{obra.cliente}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 font-bold text-sm uppercase">NÚMERO OT</p>
                  <p className="text-xl font-black">{obra.numeroOT}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-sm uppercase">CÓDIGO CLIENTE</p>
                  <p className="text-xl font-black">{obra.codigoCliente}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR CODE MOCKUP */}
          <div className="flex-1 flex items-center justify-center w-full my-8">
            <div className="border-[15px] border-black p-4 bg-white">
              <div className="w-[350px] h-[350px] relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="0" y="0" width="10" height="10" fill="black" />
                  <rect x="0" y="90" width="10" height="10" fill="black" />
                  <rect x="90" y="0" width="10" height="10" fill="black" />
                  <path d="M 20 20 h 5 v 5 h -5 z M 30 20 h 2 v 2 h -2 z" fill="black" />
                  <path d="M 25 35 h 10 v 2 h -10 z M 50 40 h 20 v 5 h -20 z" fill="black" />
                  <path d="M 70 70 h 10 v 10 h -10 z M 80 80 h 5 v 5 h -5 z" fill="black" />
                  <rect x="40" y="40" width="20" height="20" fill="#0a3d62" fillOpacity="0.2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full text-center space-y-4 mb-16">
            <p className="text-lg font-bold text-gray-400 uppercase">ESCANEE EL CÓDIGO PARA ACCESO DIRECTO</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-[10px] border-[#0a3d62] py-8 px-12 text-center bg-gray-50">
          <p className="text-xl font-black text-[#0a3d62] leading-tight">
            PARA ACCEDER A LA DOCUMENTACIÓN TÉCNICA Y PLANOS DE ESTA OBRA
          </p>
        </div>
      </div>
    </div>
  );
}
