
"use client"

import { useState, useMemo } from 'react';
import { 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Key,
  Loader2,
  UserCheck
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UsuarioCliente } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  const clientsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'usuarios_clientes');
  }, [db]);

  const { data: clients, loading } = useCollection<UsuarioCliente>(clientsQuery);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(client => 
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const clientsRef = collection(db, 'usuarios_clientes');
    addDoc(clientsRef, formData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: clientsRef.path,
          operation: 'create',
          requestResourceData: formData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Usuario habilitado",
      description: `El usuario ${formData.nombre} ha sido creado correctamente.`,
    });
    setFormData({ nombre: '', email: '', password: '' });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (!db || !confirm(`¿Eliminar al usuario ${nombre}?`)) return;

    const docRef = doc(db, 'usuarios_clientes', id);
    deleteDoc(docRef).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pt-10 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            Usuarios Habilitados
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Gestionar accesos web para visualización de documentos técnicos.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-xl h-11 font-bold shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Habilitar Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input 
                  id="nombre" 
                  placeholder="Ej. Roberto Sánchez" 
                  className="rounded-xl"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="cliente@empresa.com" 
                    className="pl-10 rounded-xl" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña de Acceso</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 rounded-xl"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="rounded-xl font-bold">Guardar Usuario</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-secondary">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o email..." 
            className="pl-10 h-11 bg-secondary/30 border-none rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-secondary overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-bold">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Nombre</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Email</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-secondary/10 transition-colors">
                    <TableCell className="font-bold text-gray-800">{client.nombre}</TableCell>
                    <TableCell className="text-muted-foreground font-medium">{client.email}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="flex items-center gap-2 font-medium">
                            <Edit className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive flex items-center gap-2 font-bold"
                            onClick={() => handleDelete(client.id, client.nombre)}
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
          </div>
        )}
        {!loading && filteredClients.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-secondary/30 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-black">No hay usuarios</h3>
            <p className="text-muted-foreground font-medium">Registre su primer usuario habilitado para empezar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
