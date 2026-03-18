
"use client"

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Trash2, 
  UserPlus,
  Mail,
  Key,
  Loader2,
  UserCheck,
  ShieldCheck,
  Eye,
  EyeOff
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
import { UsuarioHabilitado } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function UsuariosHabilitadosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'usuarios_clientes');
  }, [db]);

  const { data: users, loading } = useCollection<UsuarioHabilitado>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    // Guardamos el email en minúsculas para consistencia en la búsqueda
    const dataToSave = {
      ...formData,
      email: formData.email.toLowerCase().trim()
    };

    const usersRef = collection(db, 'usuarios_clientes');
    addDoc(usersRef, dataToSave)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: usersRef.path,
          operation: 'create',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Usuario Creado",
      description: `El acceso para ${formData.nombre} ha sido habilitado.`,
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
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-[#0a3d62]">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Usuarios Habilitados
          </h1>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Sincronización de Accesos con App Android</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setShowPassword(false);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0a3d62] hover:bg-[#0a3d62]/90 flex items-center gap-2 rounded-2xl h-14 px-8 font-black shadow-xl shadow-[#0a3d62]/20 transition-all active:scale-95">
              <UserPlus className="w-5 h-5" /> NUEVO USUARIO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-[#0a3d62]">Habilitar Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveUser} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</Label>
                <Input 
                  id="nombre" 
                  placeholder="Ej. Roberto Sánchez" 
                  className="rounded-xl h-12 bg-secondary/30"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@tamer.com" 
                    className="pl-12 rounded-xl h-12 bg-secondary/30" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-12 pr-12 rounded-xl h-12 bg-secondary/30"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter className="pt-6 gap-3">
                <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
                <Button type="submit" className="rounded-xl font-black bg-primary px-8">HABILITAR ACCESO</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-secondary flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o email..." 
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
            <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">Conectando con Firestore...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20 border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] py-6 px-8 text-[#0a3d62]">Nombre Completo</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] py-6 text-[#0a3d62]">Email / Usuario</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] py-6 px-8 text-[#0a3d62]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-secondary/10 transition-colors border-secondary">
                    <TableCell className="font-black text-gray-800 px-8 py-5">{user.nombre}</TableCell>
                    <TableCell className="text-primary font-bold">{user.email}</TableCell>
                    <TableCell className="text-right px-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-secondary">
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                          <DropdownMenuItem 
                            className="text-destructive flex items-center gap-3 font-black px-4 py-3 rounded-xl cursor-pointer"
                            onClick={() => handleDelete(user.id, user.nombre)}
                          >
                            <Trash2 className="w-4 h-4" /> ELIMINAR ACCESO
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
        {!loading && filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <div className="mx-auto w-24 h-24 bg-secondary/30 rounded-[2rem] flex items-center justify-center mb-6">
              <UserCheck className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-[#0a3d62]">Sin registros</h3>
            <p className="text-muted-foreground font-bold mt-2">No hay usuarios habilitados en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
