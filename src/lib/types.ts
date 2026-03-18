
export interface ObraFile {
  name: string;
  id: string;
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
  createdAt: number;
  files?: ObraFile[]; // Lista de objetos con nombre e ID de Drive
  driveFolderUrl?: string;
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
  nombre: string;
  direccion: string;
  nit: string;
  telefono: string;
  email: string;
  usuarioAdmin: string;
  passwordAdmin: string;
  logoUrl?: string;
  web?: string;
}
