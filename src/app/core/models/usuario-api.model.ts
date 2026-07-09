export interface UsuarioResponse {
  idUsuario: number;
  usuario: string;
  nombre: string;
  apellido1: string;
  dni: string;
  idRol: number;
  nombreRol: string;
  estado: boolean;
  dosFactorHabilitado: boolean;
  fechaRegistro: string;
}

export interface CrearUsuarioRequest {
  nombre: string;
  apellido1: string;
  dni: string;
  password: string;
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
