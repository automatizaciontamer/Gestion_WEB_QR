
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
  usuarioAcceso: string; // email principal
  claveAcceso: string;
  createdAt: number;
  files?: string[]; // Lista de nombres de archivos subidos
  driveFolderUrl?: string; // Enlace opcional a carpeta de Drive v3.3.4
  authorizedEmails: Array<{ email: string; password?: string }>;
}

export interface UsuarioHabilitado {
  id: string;
  nombre: string;
  email: string;
  password?: string;
}

export interface Empresa {
  id: string;
  nombre: string; // Razon Social
  direccion: string;
  nit: string; // CUIL
  telefono: string;
  email: string; // Email Contacto
  usuarioAdmin: string;
  passwordAdmin: string;
  logoUrl?: string;
  web?: string;
}
