export interface PermisoPorFuncionalidad {
  idFuncionalidad: number;
  codigo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  imprimir: boolean;
}

export interface GuardarPermisosRequest {
  permisos: PermisoPorFuncionalidad[];
}
