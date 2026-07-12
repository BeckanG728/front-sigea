export interface Permisos {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  imprimir: boolean;
}

export interface FuncionalidadNode {
  idFuncionalidad: number;
  codigo: string;
  nombre: string;
  ruta?: string;
  icon: string;
  permisos: Permisos;
  hijos?: FuncionalidadNode[];
}

export const FULL_PERMISOS: Permisos = {
  ver: true, crear: true, editar: true, eliminar: true, imprimir: true,
};

export const READ_PERMISOS: Permisos = {
  ver: true, crear: false, editar: false, eliminar: false, imprimir: false,
};

export const ICON_MAP: Record<string, string> = {
  'Seguridad': 'bi bi-shield-lock',
  'Usuarios': 'bi bi-people',
  'Roles': 'bi bi-person-badge',
  'Permisos': 'bi bi-lock',
  'Parámetros': 'bi bi-sliders',
  'Mi Cuenta': 'bi bi-key',
  'Académico': 'bi bi-book',
  'Aulas': 'bi bi-door-open',
  'Alumnos': 'bi bi-mortarboard',
  'Conceptos': 'bi bi-receipt',
  'Matrícula': 'bi bi-pencil-square',
  'Registrar Matrícula': 'bi bi-file-text',
  'Pagos': 'bi bi-credit-card',
  'Registrar Pago': 'bi bi-cash',
  'Historial de Deudas': 'bi bi-clock-history',
  'Auditoría': 'bi bi-search',
  'Registro de Auditoría': 'bi bi-list-check',
  'Reportes': 'bi bi-file-earmark-bar-graph',
  'Reporte de Matrícula': 'bi bi-file-text',
  'Reporte de Vacantes': 'bi bi-door-open',
  'Reporte de Deudas': 'bi bi-cash-stack',
  'Reporte de Caja': 'bi bi-cash-coin',
  'Reporte de Auditoría': 'bi bi-journal-check',
  'Panel director': 'bi bi-building',
};

export function getIcon(nombre: string): string {
  return ICON_MAP[nombre] ?? 'bi bi-circle';
}
