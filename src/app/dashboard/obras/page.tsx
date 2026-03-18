
"use client"

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  QrCode,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
      obra.numeroOF.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.numeroOT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.nombreObra.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [obras, searchTerm]);

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
      description: "El registro ha sido removido de la base de datos.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Obras</h1>
          <p className="text-sm text-muted-foreground">Listado de proyectos activos y finalizados.</p>
        </div>
        <Link href="/dashboard/obras/new">
          <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Obra
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por OF, OT o Cliente..." 
            className="pl-10 h-10 bg-secondary/50 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 h-10">
          <Filter className="w-4 h-4" /> Filtros
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando obras...</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="font-semibold">N° OF / OT</TableHead>
                  <TableHead className="font-semibold">Nombre de Obra</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Cod. Cliente</TableHead>
                  <TableHead className="font-semibold">Acceso App</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObras.map((obra) => (
                  <TableRow key={obra.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{obra.numeroOF}</span>
                        <span className="text-xs text-muted-foreground">{obra.numeroOT}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{obra.nombreObra}</TableCell>
                    <TableCell>{obra.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{obra.codigoCliente}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{obra.usuarioAcceso}</span>
                        <span className="text-muted-foreground">Clave: {obra.claveAcceso}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/obras/edit?id=${obra.id}`} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Editar Obra
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/obras/qr?id=${obra.id}`} className="flex items-center gap-2">
                              <QrCode className="w-4 h-4" /> Generar Ficha QR
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive flex items-center gap-2"
                            onClick={() => handleDelete(obra.id, obra.nombreObra)}
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredObras.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No se encontraron obras</h3>
                <p className="text-muted-foreground">Registre su primera obra para empezar.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
