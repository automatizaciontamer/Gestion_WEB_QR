
export interface ObraFile {
  name: string;
  id: string;
  url?: string; // URL de descarga directa almacenada en Firebase
}

export interface Obra {
  id: string;
  numeroOF: string;
  numeroOT: string;
  codigoCliente: string;
  nombreObra: string;
  cliente: string;
  direccion: string;
  descripcion: string;
  imageUrl?: string;
  usuarioAcceso: string;
  claveAcceso: string;
  usuarioCliente?: string;
  claveCliente?: string;
  createdAt: number;
  files?: ObraFile[]; // Lista de objetos con nombre, ID y URL
  driveFolderUrl?: string;
  authorizedEmails: Array<{ email: string; password?: string }>;
  status?: 'activa' | 'finalizada';
}


export interface UsuarioHabilitado {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
}


export interface Empresa {
  id: string;
  nombre: string;
  direccion: string;
  nit: string;
  telefono: string;
  email: string;
  usuarioAdmin: string;
  passwordAdmin: string;
  logoUrl?: string;
  web?: string;
  claveAccesoInfo?: string;
  horarios?: ConfiguracionHorarios;
}


export interface TareaDetalle {
  fecha: number;
  estado: string;
  detalle: string;
  usuario: string;
}

export interface Pausa {
  id: string;
  inicio: number;
  fin?: number;
  motivo: string;
  aprobada: boolean | null;
  respuestaAdmin?: string;
}

export type TareaEstado = 'pendiente' | 'en_progreso' | 'pausada' | 'finalizada';

export interface Tarea {
  id: string;
  nombre: string;
  obraId?: string;
  obraNombre?: string;
  usuarioAsignadoId: string;
  usuarioAsignadoNombre: string;
  tiempoDestinado: number; // Horas planeadas
  estado: TareaEstado;
  aceptada: boolean;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  totalHorasEfectivas?: number;
  detalles: TareaDetalle[];
  pausas: Pausa[];
  fechaInicioAsignada?: number;
  fechaFinAsignada?: number;
}


export interface HorarioDia {
  habilitado: boolean;
  desde: string; // "HH:MM"
  hasta: string; // "HH:MM"
}

export interface ConfiguracionHorarios {
  lunes: HorarioDia;
  martes: HorarioDia;
  miercoles: HorarioDia;
  jueves: HorarioDia;
  viernes: HorarioDia;
  sabado: HorarioDia;
  domingo: HorarioDia;
}
