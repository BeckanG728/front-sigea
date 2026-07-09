export interface Modulo {
  key: string;
  label: string;
  desc: string;
}

export interface SubPermiso {
  key: string;
  label: string;
  desc: string;
}

export type PermisoMap = Record<string, boolean>;
