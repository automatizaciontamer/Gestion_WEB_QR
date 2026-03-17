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
  authorizedEmails: Array<{ email: string; password?: string }>;
}

export interface Archivo {
  id: string;
  obraId: string;
  nombre: string;
  urlStorage: string;
  visibleCliente: boolean;
  fechaSubida: number | Date;
  usuario: string; // admin email
}

export interface UsuarioCliente {
  id: string;
  nombre: string;
  email: string;
  password?: string;
}

export interface EmpresaConfig {
  logoUrl: string;
  email: string;
  passwordAdmin: string;
}