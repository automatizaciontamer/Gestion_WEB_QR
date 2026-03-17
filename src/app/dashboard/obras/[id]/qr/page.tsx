"use client"

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Obra } from '@/lib/types';

export default function QRPosterPage() {
  const { id } = useParams();
  const router = useRouter();
  const [obra, setObra] = useState<Obra | null>(null);

  useEffect(() => {
    // Mock fetch for now
    const mockObra: Obra = {
      id: id as string,
      numeroOF: 'OF-1002',
      numeroOT: 'OT-5542',
      codigoCliente: 'C001',
      nombreObra: 'INSTALACIÓN PLANTA NORTE',
      cliente: 'INDUSTRIAL S.A.',
      direccion: 'AV. LAS PALMAS 450, LIMA',
      descripcion: 'INSTALACIÓN DE PANELES DE CONTROL Y AUTOMATIZACIÓN.',
      usuarioAcceso: 'NORTE@INDUSTRIAL.COM',
      claveAcceso: '12345',
      authorizedEmails: []
    };
    setObra(mockObra);
  }, [id]);

  if (!obra) return null;

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

          {/* GIANT QR CODE MOCKUP */}
          <div className="flex-1 flex items-center justify-center w-full my-8">
            <div className="border-[15px] border-black p-4 bg-white">
              <div className="w-[350px] h-[350px] relative">
                {/* SVG Mock of a QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="0" y="0" width="10" height="10" fill="black" />
                  <rect x="0" y="10" width="1" height="1" fill="black" />
                  <rect x="10" y="0" width="1" height="1" fill="black" />
                  <rect x="0" y="90" width="10" height="10" fill="black" />
                  <rect x="90" y="0" width="10" height="10" fill="black" />
                  <rect x="20" y="20" width="60" height="60" fill="black" fillOpacity="0.05" />
                  <path d="M 20 20 h 5 v 5 h -5 z M 30 20 h 2 v 2 h -2 z M 40 20 h 8 v 2 h -8 z" fill="black" />
                  <path d="M 25 35 h 10 v 2 h -10 z M 50 40 h 20 v 5 h -20 z M 30 60 h 5 v 10 h -5 z" fill="black" />
                  <path d="M 70 70 h 10 v 10 h -10 z M 80 80 h 5 v 5 h -5 z M 20 80 h 5 v 5 h -5 z" fill="black" />
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