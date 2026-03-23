
"use client"

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Trash2, 
  Plus,
  Loader2,
  ListTodo,
  Clock,
  User,
  FileText,
  CheckCircle2,

  PauseCircle,
  PlayCircle,
  History,
  AlertCircle,
  Calendar,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tarea, UsuarioHabilitado, TareaEstado, Pausa } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';

import { useAuth } from '@/lib/auth-context';
import { calculateEffectiveHours } from '@/lib/time-utils';

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function TareasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [pauseMotivo, setPauseMotivo] = useState('');
  const [historyDetail, setHistoryDetail] = useState('');

  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    usuarioAsignadoId: '',
    tiempoDestinado: 0
  });

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'usuarios_clientes') as any;
  }, [db]);

  const { data: allUsers } = useCollection<UsuarioHabilitado>(usersQuery);

  // Consulta parametrizada según rol
  const tareasQuery = useMemo(() => {
    if (!db || !user) return null;
    const ref = collection(db, 'tareas');
    return query(ref, orderBy('createdAt', 'desc')) as any;
  }, [db, user]);

  const { data: allTareas, loading } = useCollection<Tarea>(tareasQuery);

  const filteredTareas = useMemo(() => {
    // Filtrar por permisos y búsqueda
    let list = allTareas;
    if (!isAdmin && user) {
      list = list.filter(t => t.usuarioAsignadoId === user.id);
    }
    
    return list.filter(t => 
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.usuarioAsignadoNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTareas, searchTerm, isAdmin, user]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Gestión de Tareas - Tamer Industrial", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    const tableData = filteredTareas.map(t => {
      let efec = t.totalHorasEfectivas || 0;
      let ratio = t.tiempoDestinado / (efec || 1);
      let effScore = efec > 0 ? `${Math.min(100, ratio * 100).toFixed(0)}%` : '---';
      
      // Calcular total de horas en pausas aprobadas
      let pauseHrs = t.pausas
        .filter(p => p.aprobada && p.fin)
        .reduce((acc, p) => acc + ((p.fin! - p.inicio) / (1000 * 60 * 60)), 0);

      return [
        t.nombre,
        t.usuarioAsignadoNombre,
        t.estado.toUpperCase(),
        `${t.tiempoDestinado} Hs`,
        efec > 0 ? `${efec.toFixed(2)} Hs` : '---',
        pauseHrs > 0 ? `${pauseHrs.toFixed(2)} Hs` : '---',
        effScore,
        t.startedAt ? new Date(t.startedAt).toLocaleDateString() : '---',
        t.finishedAt ? new Date(t.finishedAt).toLocaleDateString() : '---'
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Tarea', 'Usuario', 'Estado', 'Presup.', 'Efectivo', 'Pausas', 'Efic.', 'Inicio', 'Fin']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [10, 61, 98] },
      styles: { fontSize: 8 },
    });



    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_tareas_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "PDF Generado", description: "El reporte se ha descargado correctamente." });
  };


  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!db) return;

    const assignedUser = allUsers?.find(u => u.id === formData.usuarioAsignadoId);
    if (!assignedUser) return;

    const newTask: Omit<Tarea, 'id'> = {
      nombre: formData.nombre,
      usuarioAsignadoId: assignedUser.id,
      usuarioAsignadoNombre: assignedUser.nombre,
      tiempoDestinado: Number(formData.tiempoDestinado),
      estado: 'pendiente' as TareaEstado,
      aceptada: false,
      createdAt: Date.now(),
      detalles: [],
      pausas: []
    };

    try {
      await addDoc(collection(db, 'tareas'), newTask);
      setIsNewTaskOpen(false);
      setFormData({ nombre: '', usuarioAsignadoId: '', tiempoDestinado: 0 });
      toast({ title: "Tarea Creada", description: "La tarea ha sido asignada correctamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear la tarea.", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (tarea: Tarea, newStatus: TareaEstado, detailMsg: string) => {
    if (!db) return;

    const updateData: Partial<Tarea> = {
      estado: newStatus,
      detalles: [
        {
          fecha: Date.now(),
          estado: newStatus,
          detalle: detailMsg,
          usuario: user?.nombre || 'SISTEMA'
        },
        ...tarea.detalles
      ]
    };

    if (newStatus === 'en_progreso' && !tarea.aceptada) {
      updateData.aceptada = true;
      updateData.startedAt = Date.now();
    }

    if (newStatus === 'finalizada') {
      // Obtener configuración de horarios de la empresa para el cálculo
      const empresaRef = doc(db, 'Configuracion', 'Empresa');
      const empresaSnap = await getDoc(empresaRef);
      const empresaData = empresaSnap.data();
      const configHorarios = empresaData?.horarios;

      updateData.finishedAt = Date.now();
      updateData.totalHorasEfectivas = calculateEffectiveHours(
        tarea.startedAt || tarea.createdAt, 
        Date.now(), 
        configHorarios, 
        tarea.pausas
      );
    }


    try {
      await updateDoc(doc(db, 'tareas', tarea.id), updateData);
      setHistoryDetail('');
      toast({ title: "Tarea Actualizada", description: `Estado cambiado a ${newStatus}` });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar la tarea.", variant: "destructive" });
    }
  };

  const handleRequestPause = async () => {
    if (!db || !selectedTarea) return;

    const newPause: Pausa = {
      id: Math.random().toString(36).substr(2, 9),
      inicio: Date.now(),
      motivo: pauseMotivo,
      aprobada: null
    };

    try {
      await updateDoc(doc(db, 'tareas', selectedTarea.id), {
        estado: 'pausada' as TareaEstado,
        pausas: [newPause, ...selectedTarea.pausas],
        detalles: [
          {
            fecha: Date.now(),
            estado: 'pausada',
            detalle: `Solicitud de pausa: ${pauseMotivo}`,
            usuario: user?.nombre || 'Usuario'
          },
          ...selectedTarea.detalles
        ]
      });
      setIsPauseOpen(false);
      setPauseMotivo('');
      toast({ title: "Pausa Solicitada", description: "Aguardando aprobación del administrador." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo solicitar la pausa.", variant: "destructive" });
    }
  };

  const handleReviewPause = async (tarea: Tarea, pauseId: string, approve: boolean) => {
    if (!db) return;

    const updatedPausas = tarea.pausas.map(p => {
      if (p.id === pauseId) {
        return { ...p, aprobada: approve, fin: approve ? undefined : Date.now() }; // Si se deniega, la pausa "termina" ya
      }
      return p;
    });

    const updateData: Partial<Tarea> = {
      pausas: updatedPausas,
      estado: approve ? 'pausada' : 'en_progreso',
      detalles: [
        {
          fecha: Date.now(),
          estado: approve ? 'pausada' : 'en_progreso',
          detalle: approve ? 'Pausa aprobada por administrador' : 'Pausa denegada por administrador',
          usuario: user?.nombre || 'ADMIN'
        },
        ...tarea.detalles
      ]
    };

    try {
      await updateDoc(doc(db, 'tareas', tarea.id), updateData);
      toast({ title: approve ? "Pausa Aprobada" : "Pausa Denegada" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
    }
  };

  const handleResumeTask = async (tarea: Tarea) => {
    if (!db) return;

    const updatedPausas = tarea.pausas.map(p => {
      if (p.inicio && !p.fin) {
        return { ...p, fin: Date.now() };
      }
      return p;
    });

    try {
      await updateDoc(doc(db, 'tareas', tarea.id), {
        estado: 'en_progreso' as TareaEstado,
        pausas: updatedPausas,
        detalles: [
          {
            fecha: Date.now(),
            estado: 'en_progreso',
            detalle: 'Tarea reanudada',
            usuario: user?.nombre || 'Usuario'
          },
          ...tarea.detalles
        ]
      });
      toast({ title: "Tarea Reanudada" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo reanudar la tarea.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("¿Eliminar esta tarea definitivamente?")) return;
    try {
      await deleteDoc(doc(db, 'tareas', id));
      toast({ title: "Tarea Eliminada" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar la tarea.", variant: "destructive" });
    }
  };

  const getStatusColor = (status: TareaEstado) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'en_progreso': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pausada': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'finalizada': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8 pt-16 lg:pt-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#0a3d62] flex items-center gap-4">
            <ListTodo className="w-10 h-10 text-primary" />
            Gestión de Tareas
          </h1>
          <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">
            Seguimiento de Producción y Tiempos Efectivos
          </p>
        </div>
        
        <div className="flex gap-4">
          {isAdmin && (
            <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
              <Button onClick={() => setIsNewTaskOpen(true)} className="h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-3xl font-black px-10 shadow-2xl shadow-[#0a3d62]/20 gap-3 transition-all active:scale-95">
                <Plus className="w-6 h-6" /> NUEVA TAREA
              </Button>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#0a3d62]">Crear Nueva Tarea</DialogTitle>
                  <CardDescription>Asigna una tarea a un usuario y define el tiempo estimado.</CardDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre de la Tarea</Label>
                    <Input 
                      placeholder="Ej. Armado de Tablero Eléctrico" 
                      className="h-14 rounded-2xl bg-secondary/30"
                      value={formData.nombre}
                      onChange={e => setFormData({...formData, nombre: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Asignar A</Label>
                      <Select onValueChange={val => setFormData({...formData, usuarioAsignadoId: val})} required>
                        <SelectTrigger className="h-14 rounded-2xl bg-secondary/30">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers?.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tiempo Estimado (Hs)</Label>
                      <Input 
                        type="number" 
                        placeholder="8" 
                        className="h-14 rounded-2xl bg-secondary/30"
                        value={formData.tiempoDestinado === 0 ? '' : formData.tiempoDestinado}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({...formData, tiempoDestinado: val === '' ? 0 : Number(val)});
                        }}
                        required 
                      />

                    </div>
                  </div>
                  <DialogFooter className="pt-6">
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-[#0a3d62] font-black text-white hover:bg-[#0a3d62]/90">CREAR Y ASIGNAR TAREA</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={handleExportPDF} variant="outline" className="h-16 border-[#0a3d62] text-[#0a3d62] hover:bg-secondary rounded-3xl font-black px-10 shadow-xl gap-3 transition-all active:scale-95">
            <FileText className="w-6 h-6 text-primary" /> EXPORTAR PDF
          </Button>
        </div>

      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-secondary flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o usuario..." 
            className="pl-14 h-14 bg-secondary/20 border-none rounded-2xl font-bold text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#0a3d62]" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Sincronizando Tareas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTareas.map(tarea => (
            <Card key={tarea.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden hover:shadow-2xl transition-all border border-transparent hover:border-primary/20 group">
              <div className={`h-2 w-full ${getStatusColor(tarea.estado).split(' ')[0]}`} />
              <CardHeader className="p-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(tarea.estado)}`}>
                        {tarea.estado.replace('_', ' ')}
                      </span>
                      {tarea.estado === 'pausada' && tarea.pausas[0]?.aprobada === null && (
                        <span className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black animate-pulse">
                          <AlertCircle className="w-3 h-3" /> PENDIENTE APROBACIÓN
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-black text-[#0a3d62] uppercase leading-tight group-hover:text-primary transition-colors">
                      {tarea.nombre}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-secondary h-12 w-12 text-[#0a3d62]">
                        <MoreVertical className="w-6 h-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-[1.5rem] p-3 border-none shadow-2xl w-56">
                      <DropdownMenuItem 
                        className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl cursor-pointer"
                        onClick={() => { setSelectedTarea(tarea); setIsDetailOpen(true); }}
                      >
                        <History className="w-5 h-5 text-primary" /> VER HISTORIAL
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem 
                          className="text-destructive flex items-center gap-3 font-black px-4 py-3 rounded-xl cursor-pointer"
                          onClick={() => handleDelete(tarea.id)}
                        >
                          <Trash2 className="w-5 h-5" /> ELIMINAR TAREA
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-2xl">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Operario</p>
                      <p className="text-xs font-black text-[#0a3d62] truncate">{tarea.usuarioAsignadoNombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-2xl">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Presupuestado</p>
                      <p className="text-xs font-black text-[#0a3d62]">{tarea.tiempoDestinado} Horas</p>
                    </div>
                  </div>
                </div>

                {tarea.estado === 'finalizada' && (
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Tiempo Efectivo Final</p>
                        <p className="text-lg font-black">{tarea.totalHorasEfectivas?.toFixed(2)} Horas</p>
                      </div>
                    </div>
                    {tarea.totalHorasEfectivas && tarea.totalHorasEfectivas <= tarea.tiempoDestinado ? (
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black">DENTRO DEL TIEMPO</span>
                    ) : (
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black">FUERA DE TIEMPO</span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  {/* ACCIONES DE USUARIO */}
                  {!isAdmin && tarea.estado === 'pendiente' && (
                    <Button 
                      className="flex-1 bg-primary text-white font-black rounded-xl h-12 shadow-lg shadow-primary/20"
                      onClick={() => handleUpdateStatus(tarea, 'en_progreso', 'Tarea aceptada por operario')}
                    >
                      ACEPTAR TAREA
                    </Button>
                  )}
                  {!isAdmin && tarea.estado === 'en_progreso' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-[#0a3d62] text-[#0a3d62] font-black rounded-xl h-12"
                        onClick={() => { setSelectedTarea(tarea); setIsPauseOpen(true); }}
                      >
                        SOLICITAR PAUSA
                      </Button>
                      <Button 
                        className="flex-1 bg-emerald-600 text-white font-black rounded-xl h-12 shadow-lg shadow-emerald-200"
                        onClick={() => handleUpdateStatus(tarea, 'finalizada', 'Tarea completada y finalizada')}
                      >
                        FINALIZAR
                      </Button>
                    </>
                  )}
                  {!isAdmin && tarea.estado === 'pausada' && tarea.pausas[0]?.aprobada === true && (
                    <Button 
                      className="flex-1 bg-[#0a3d62] text-white font-black rounded-xl h-12 shadow-lg shadow-[#0a3d62]/20"
                      onClick={() => handleResumeTask(tarea)}
                    >
                      REANUDAR TAREA
                    </Button>
                  )}

                  {/* ACCIONES DE ADMIN (APROBAR PAUSAS) */}
                  {isAdmin && tarea.estado === 'pausada' && tarea.pausas[0]?.aprobada === null && (
                    <div className="flex w-full gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-200">
                      <p className="text-xs font-bold text-orange-800 flex-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Solicitud de pausa pendiente: "{tarea.pausas[0].motivo}"
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 h-10 px-4 rounded-xl font-black"
                          onClick={() => handleReviewPause(tarea, tarea.pausas[0].id, true)}
                        >
                          APROBAR
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="h-10 px-4 rounded-xl font-black"
                          onClick={() => handleReviewPause(tarea, tarea.pausas[0].id, false)}
                        >
                          DENEGAR
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DIALOGO DE PAUSA */}
      <Dialog open={isPauseOpen} onOpenChange={setIsPauseOpen}>
        <DialogContent className="rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#0a3d62]">Solicitar Pausa</DialogTitle>
            <CardDescription>Indica el motivo de la pausa. El administrador debe aprobarla.</CardDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Motivo de la Pausa</Label>
            <Textarea 
              placeholder="Ej. Falta de insumos, descanso, emergencia..." 
              className="rounded-2xl bg-secondary/30 h-32"
              value={pauseMotivo}
              onChange={e => setPauseMotivo(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-6">
            <Button className="w-full h-14 rounded-2xl bg-[#0a3d62] font-black" onClick={handleRequestPause}>ENVIAR SOLICITUD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOGO DE DETALLE / HISTORIAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#0a3d62] p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight">{selectedTarea?.nombre}</DialogTitle>
              <CardDescription className="text-white/70 font-bold uppercase tracking-widest text-[10px]">Asignado a: {selectedTarea?.usuarioAsignadoNombre}</CardDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Agregar Observación / Registro
              </Label>
              <div className="flex gap-3">
                <Textarea 
                  placeholder="Escribe un avance o detalle técnico..." 
                  className="rounded-2xl bg-secondary/30 flex-1"
                  value={historyDetail}
                  onChange={e => setHistoryDetail(e.target.value)}
                />
                <Button 
                  className="h-auto px-6 bg-[#0a3d62] rounded-2xl font-black"
                  onClick={() => selectedTarea && handleUpdateStatus(selectedTarea, selectedTarea.estado, historyDetail)}
                  disabled={!historyDetail}
                >
                  REGISTRAR
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a3d62] border-b pb-2 block">Línea de Tiempo y Eventos</Label>
              <div className="space-y-4">
                {selectedTarea?.detalles.map((d, index) => (
                  <div key={index} className="flex gap-4 items-start relative pb-6">
                    {index < selectedTarea.detalles.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-secondary" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      d.estado === 'finalizada' ? 'bg-emerald-500' : d.estado === 'pausada' ? 'bg-orange-500' : 'bg-primary'
                    }`}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="flex-1 bg-secondary/20 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">{d.usuario}</span>
                        <span className="text-[9px] font-black text-muted-foreground">{new Date(d.fecha).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-[#0a3d62] uppercase text-[10px] mb-2">{d.estado.replace('_', ' ')}</p>
                      <p className="text-sm font-medium text-gray-700">{d.detalle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 border-t flex justify-end">
            <Button variant="ghost" className="rounded-xl font-black" onClick={() => setIsDetailOpen(false)}>CERRAR</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
