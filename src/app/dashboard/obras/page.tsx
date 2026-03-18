
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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Obra } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ObrasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  const { toast } = useToast();
  
  const obrasQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'obras');
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

  const handleCopyLink = (id: string) => {
    if (typeof window === 'undefined') return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/obra/view?id=${id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Enlace Copiado",
      description: "El link directo para el visor ha sido copiado al portapapeles.",
    });
  };

  const handleDelete = (id: string, nombre: string) => {
    if (!db || !confirm(`¿Estás seguro de eliminar la obra "${nombre}"?`)) return;

    const docRef = doc(db, 'obras', id);
    deleteDoc(docRef).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
    
    toast({
      title: "Obra eliminada",
      description: "El registro ha sido removido.",
    });
  };

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0a3d62]">Gestión de Obras</h1>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px]">v5.0.6 - Sincronizado Cloud</p>
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
            <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">Cargando v5.0.6...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20 border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] py-6 px-8 text-[#0a3d62]">N° OF / OT</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] py-6 text-[#0a3d62]">Obra / Proyecto</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] py-6 text-[#0a3d62]">Cliente</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] py-6 text-[#0a3d62]">Estado</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] py-6 px-8 text-[#0a3d62]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObras.map((obra) => (
                  <TableRow key={obra.id} className="hover:bg-secondary/10 transition-colors border-secondary">
                    <TableCell className="px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-base">{obra.numeroOF}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{obra.numeroOT}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-800">{obra.nombreObra}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{obra.cliente}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{obra.codigoCliente}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#0a3d62] text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
                        ACTIVO QR
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
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
                          <DropdownMenuItem 
                            onClick={() => handleCopyLink(obra.id)}
                            className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl cursor-pointer"
                          >
                            <Copy className="w-4 h-4 text-primary" /> COPIAR LINK VISOR
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/obra/view?id=${obra.id}`} target="_blank" className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl cursor-pointer">
                              <ExternalLink className="w-4 h-4 text-primary" /> ABRIR VISOR PÚBLICO
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive flex items-center gap-3 font-black px-4 py-3 rounded-xl cursor-pointer"
                            onClick={() => handleDelete(obra.id, obra.nombreObra)}
                          >
                            <Trash2 className="w-4 h-4" /> ELIMINAR
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
