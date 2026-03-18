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
  AlertCircle
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Error de Acceso</h1>
          <p className="text-muted-foreground">No se ha proporcionado una identificación de obra válida. Por favor, escanee el código QR nuevamente.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-primary">Cargando Documentación Técnica...</p>
        </div>
      </div>
    );
  }

  if (!obra || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/20">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Obra No Encontrada</h1>
          <p className="text-muted-foreground">La obra solicitada no existe o no está disponible en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-12">
      {/* Header Corporativo */}
      <div className="bg-[#0a3d62] text-white py-8 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black tracking-tight uppercase">Tamer Industrial S.A.</h1>
            <p className="text-xs font-bold opacity-70 tracking-widest">VISOR DE DOCUMENTACIÓN TÉCNICA</p>
          </div>
          <Badge variant="outline" className="border-white/40 text-white font-mono text-lg py-1 px-4">
            OF: {obra.numeroOF}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6 space-y-6">
        {/* Card de Información Principal */}
        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center gap-3">
              <Construction className="w-6 h-6 text-primary" />
              <CardTitle className="text-xl uppercase font-black">{obra.nombreObra}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 space-y-4 border-b md:border-b-0 md:border-r">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Cliente / Empresa</p>
                    <p className="font-bold text-gray-800">{obra.cliente}</p>
                    <p className="text-xs text-muted-foreground font-mono">Cod: {obra.codigoCliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Ubicación</p>
                    <p className="font-bold text-gray-800">{obra.direccion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4 bg-gray-50/50">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Detalles del Proyecto</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {obra.descripcion || 'Sin descripción técnica adicional.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Documentos */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#0a3d62] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Planos y Archivos Digitales
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {obra.files && obra.files.length > 0 ? (
              obra.files.map((fileName, idx) => (
                <Card key={idx} className="border-none shadow-md hover:shadow-lg transition-shadow bg-white group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                          {fileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Documento Técnico</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary text-primary">
                      <Download className="w-4 h-4" /> <span className="hidden sm:inline">Ver Archivo</span>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-white/50 border-2 border-dashed border-muted rounded-2xl p-12 text-center space-y-3">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground font-medium">No hay archivos vinculados a esta obra aún.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Informativo */}
        <footer className="pt-8 text-center space-y-4">
          <div className="h-px bg-gray-200 w-full" />
          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} Tamer Industrial S.A. - Gestión de Ingeniería
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function ObraViewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Cargando visor...</div>}>
      <ObraViewContent />
    </Suspense>
  );
}
