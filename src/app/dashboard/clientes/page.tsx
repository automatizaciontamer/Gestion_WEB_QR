"use client"

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Key
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

const mockClients: UsuarioCliente[] = [
  { id: '1', nombre: 'Juan Pérez', email: 'juan@industrial.com' },
  { id: '2', nombre: 'María García', email: 'm.garcia@energia.com' },
  { id: '3', nombre: 'Carlos Ruiz', email: 'c.ruiz@mineria.com' },
];

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<UsuarioCliente[]>(mockClients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredClients = clients.filter(client => 
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Cliente guardado",
      description: "Los datos del cliente se han actualizado correctamente.",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestionar accesos individuales para visualización de documentos.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Usuario Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" placeholder="Ej. Roberto Sánchez" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="cliente@empresa.com" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña Provisional</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-10" required />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar Usuario</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o email..." 
            className="pl-10 h-10 bg-secondary/50 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="hover:bg-secondary/20 transition-colors">
                <TableCell className="font-medium">{client.nombre}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Edit className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredClients.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No hay usuarios</h3>
            <p className="text-muted-foreground">Registre su primer usuario cliente para empezar.</p>
          </div>
        )}
      </div>
    </div>
  );
}