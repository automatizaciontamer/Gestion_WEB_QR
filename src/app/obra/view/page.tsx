
"use client"

import { useSearchParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, Suspense } from 'react';
import { Obra } from '@/lib/types';
import { 
  FileText, 
  Download, 
  Construction, 
  MapPin, 
  User, 
  Info,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function ObraViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const db = useFirestore();

  const obraDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'obras', id);
  }, [db, id]);

  const { data: obra, loading, error } = useDoc<Obra>(obraDocRef);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20 font-body">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-2xl">
          <AlertCircle className="w-20 h-20 text-destructive mx-auto" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Error de Acceso</h1>
          <p className="text-muted-foreground font-medium">No se ha detectado una identificación de obra. Por favor, escanee el código QR del cartel técnico.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <p className="text-lg font-black text-primary uppercase tracking-widest">Sincronizando Archivos...</p>
        </div>
      </div>
    );
  }

  if (!obra || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-2xl">
          <AlertCircle className="w-20 h-20 text-destructive mx-auto" />
          <h1 className="text-2xl font-black text-[#0a3d62]">Obra No Encontrada</h1>
          <p className="text-muted-foreground font-medium">El proyecto solicitado no existe o ha sido deshabilitado del sistema central.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-20 font-body">
      {/* Header Corporativo */}
      <div className="bg-[#0a3d62] text-white py-12 px-6 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tighter uppercase">TAMER INDUSTRIAL S.A.</h1>
            <p className="text-[10px] font-black opacity-60 tracking-[0.4em] mt-1">SISTEMA DIGITAL DE PLANOS Y DOCUMENTACIÓN</p>
          </div>
          <Badge variant="outline" className="border-white/30 text-white font-mono text-xl py-2 px-6 rounded-2xl bg-white/10 backdrop-blur-md">
            OF: {obra.numeroOF}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 space-y-8">
        {/* Card de Información Principal */}
        <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-white border-b py-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Construction className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl uppercase font-black text-[#0a3d62] leading-tight">
                {obra.nombreObra}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 space-y-6 border-b md:border-b-0 md:border-r">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cliente / Solicitante</p>
                    <p className="font-black text-lg text-gray-800">{obra.cliente}</p>
                    <p className="text-xs font-mono text-primary font-bold">Ref: {obra.codigoCliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ubicación Técnica</p>
                    <p className="font-bold text-gray-800">{obra.direccion || 'Instalación Industrial Tamer'}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-4 bg-gray-50/50">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Especificaciones</p>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {obra.descripcion || 'Documentación técnica estandarizada bajo normas de ingeniería vigentes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Documentos */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-[#0a3d62] uppercase tracking-[0.3em] px-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" /> PLANOS Y ARCHIVOS AUTORIZADOS
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all bg-white group rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-[#0a3d62] text-sm sm:text-base truncate max-w-[180px] sm:max-w-md">
                          {fileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Revisión Técnica APROBADA</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl border-2 border-primary/20 text-primary font-black gap-2 hover:bg-primary hover:text-white transition-all">
                      <Download className="w-4 h-4" /> <span className="hidden sm:inline">DESCARGAR</span>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-white/50 border-4 border-dashed border-secondary rounded-[2.5rem] p-16 text-center space-y-4">
                <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Aún no se han vinculado planos digitales</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Informativo */}
        <footer className="pt-12 text-center space-y-6">
          <div className="h-1 bg-[#0a3d62]/10 rounded-full w-24 mx-auto" />
          <div>
            <p className="text-[10px] text-muted-foreground font-black tracking-[0.4em] uppercase">
              © {new Date().getFullYear()} TAMER INDUSTRIAL S.A.
            </p>
            <p className="text-[9px] text-muted-foreground/60 font-medium mt-1">
              Desarrollo de Ingeniería | Control de Calidad | Sincronización en Tiempo Real
            </p>
          </div>
          <Button variant="ghost" className="text-primary font-black text-[10px] tracking-widest gap-2 opacity-60 hover:opacity-100" asChild>
            <a href="https://tamer.com.ar" target="_blank" rel="noopener noreferrer">
              VISITAR SITIO WEB OFICIAL <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <ObraViewContent />
    </Suspense>
  );
}
