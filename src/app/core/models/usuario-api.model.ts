export interface UsuarioResponse {
  idUsuario: number;
  nombre: string;
  primerApellido: string;
  numeroDocumento: string;
  nombreRol: string;
  estado: boolean;
}

export interface SimpleResponse {
  mensaje: string;
  id?: number;
}

export interface CrearUsuarioRequest {
  nombre: string;
  primerApellido: string;
  numeroDocumento: string;
  idRol: number;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
