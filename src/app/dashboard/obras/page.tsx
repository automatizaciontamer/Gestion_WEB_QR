"use client"

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  QrCode,
  Loader2,
  Construction,
  Copy,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { Obra } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { deleteFolderFromDrive } from '@/lib/drive-api';
import { useAuth } from '@/lib/auth-context';


export default function ObrasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  
  const obrasQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'obras') as any;

  }, [db]);

  const { data: obras, loading } = useCollection<Obra>(obrasQuery);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    return obras.filter(obra => 
      obra.numeroOF?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.numeroOT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.nombreObra?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [obras, searchTerm]);



  const handleDelete = async (obra: Obra) => {
    if (!db) return;
    
    const confirmMessage = `¿Estás SEGURO de eliminar la obra "${obra.nombreObra}"?\n\nEsta acción eliminará permanentemente la CARPETA en Google Drive y el registro en el sistema.`;
    
    if (!confirm(confirmMessage)) return;


    toast({
      title: "Eliminando obra...",
      description: "Iniciando limpieza total en Google Drive y Firebase.",
    });

    try {
      // 1. ELIMINACIÓN EN DRIVE: Construir nombre de carpeta exacto
      const folderName = `${(obra.codigoCliente || '').trim()}-${(obra.numeroOF || '').trim()}-${(obra.numeroOT || '').trim()}`;
      
      const driveResult = await deleteFolderFromDrive(folderName);
      
      if (driveResult && driveResult.status === 'success') {
        toast({
          title: "Carpeta de Drive Eliminada",
          description: "La documentación técnica fue borrada de la nube.",
        });
      } else {
        console.warn("Drive no confirmó borrado, borrando en Firebase:", driveResult?.message);
      }

      // 2. ELIMINACIÓN EN FIREBASE
      const docRef = doc(db, 'obras', obra.id);
      await deleteDoc(docRef);
      
      toast({
        title: "Obra eliminada",
        description: "El registro ha sido borrado con éxito del sistema.",
      });
    } catch (error) {
      console.error("Error en eliminación:", error);
      const docRef = doc(db, 'obras', obra.id);
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      
      toast({
        title: "Error en eliminación",
        description: "No se pudo completar la limpieza total. Revise la conexión.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (obra: Obra) => {
    if (!db) return;
    const isFinalized = obra.status === 'finalizada';
    const newStatus = isFinalized ? 'activa' : 'finalizada';
    const confirmMsg = !isFinalized 
      ? `¿Desea dar por FINALIZADA la obra "${obra.nombreObra}"?` 
      : `¿Desea volver a marcar la obra "${obra.nombreObra}" como ACTIVA?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'obras', obra.id), { status: newStatus });
      toast({ 
        title: isFinalized ? "Obra Reactivada" : "Obra Finalizada", 
        description: `El estado de la obra ha sido actualizado correctamente.` 
      });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado de la obra.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0a3d62]">Gestión de Obras</h1>
          <p className="text-sm text-muted-foreground font-black uppercase tracking-widest text-[10px]">v5.2.0 - Sincronización Total Drive Activa</p>
        </div>
        <Link href="/dashboard/obras/new">
          <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2 h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
            <Plus className="w-5 h-5" /> NUEVA OBRA
          </Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-secondary flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por OF, OT o Cliente..." 
            className="pl-12 h-12 bg-secondary/20 border-none rounded-2xl font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-[#0a3d62]/5 border border-secondary overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-[#0a3d62]" />
            <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">Conectando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-secondary/10">
            {filteredObras.map((obra) => (
              <div key={obra.id} className="bg-white rounded-2xl border border-secondary shadow-sm p-5 flex justify-between items-start hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#0a3d62] opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col gap-2 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-[#0a3d62] leading-tight break-words">{obra.nombreObra}</h3>
                    {obra.status === 'finalizada' ? (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> FINALIZADA
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-blue-200">
                        ACTIVA
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-1">

                    <p className="text-sm font-bold text-gray-700">Cliente: <span className="font-normal text-muted-foreground">{obra.cliente}</span></p>
                    <p className="text-xs font-bold text-gray-700">OF: <strong className="font-black font-mono text-primary">{obra.numeroOF}</strong></p>
                    <p className="text-xs font-bold text-gray-700">OT: <strong className="font-black font-mono text-primary">{obra.numeroOT}</strong></p>
                  </div>
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-secondary">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[200px]">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/obras/edit?id=${obra.id}`} className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl cursor-pointer">
                          <Edit className="w-4 h-4 text-primary" /> EDITAR OBRA
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/obras/qr?id=${obra.id}`} className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl cursor-pointer">
                          <QrCode className="w-4 h-4 text-primary" /> GENERAR QR / FICHA
                        </Link>
                      </DropdownMenuItem>

                      {isAdmin && (
                        <DropdownMenuItem 
                          className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl cursor-pointer"
                          onClick={() => handleToggleStatus(obra)}
                        >
                          {obra.status === 'finalizada' ? (
                            <>
                              <Construction className="w-4 h-4 text-blue-600" /> REACTIVAR OBRA
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> FINALIZAR OBRA
                            </>
                          )}
                        </DropdownMenuItem>
                      )}


                      {isAdmin && (
                        <DropdownMenuItem 
                          className="text-destructive flex items-center gap-3 font-black px-4 py-3 rounded-xl cursor-pointer"
                          onClick={() => handleDelete(obra)}
                        >
                          <Trash2 className="w-4 h-4" /> ELIMINAR OBRA
                        </DropdownMenuItem>
                      )}


                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filteredObras.length === 0 && (
          <div className="p-20 text-center">
            <div className="mx-auto w-24 h-24 bg-secondary/30 rounded-[2rem] flex items-center justify-center mb-6">
              <Construction className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-[#0a3d62]">Sin obras</h3>
            <p className="text-muted-foreground font-bold mt-2">No se encontraron proyectos activos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
