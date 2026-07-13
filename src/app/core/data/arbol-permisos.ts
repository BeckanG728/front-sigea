export interface RamaPermiso {
  codigoBackend?: string;
  nombre: string;
  key: string;
  icon: string;
  hijos?: RamaPermiso[];
  permisosDisponibles?: string[];
  readonly?: boolean;
}

export const PERMISO_LABELS: Record<string, string> = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  imprimir: 'Exportar',
};

export const ARBOL_PERMISOS: RamaPermiso[] = [
  {
    nombre: 'Seguridad', key: 'seguridad', icon: 'bi bi-shield-lock', codigoBackend: 'SEGURIDAD',
    hijos: [
      { nombre: 'Usuarios', key: 'usuarios', codigoBackend: 'USUARIOS', icon: 'bi bi-people', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Roles', key: 'roles', codigoBackend: 'ROLES', icon: 'bi bi-person-badge', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Parámetros', key: 'parametros', codigoBackend: 'PARAMETROS', icon: 'bi bi-sliders', permisosDisponibles: ['ver', 'editar'] },
      { nombre: 'Mi Cuenta', key: 'mi-cuenta', codigoBackend: 'MI_CUENTA', icon: 'bi bi-key', readonly: true },
    ],
  },
  {
    nombre: 'Académico', key: 'academico', icon: 'bi bi-book', codigoBackend: 'ACADEMICO',
    hijos: [
      { nombre: 'Dashboard', key: 'dashboard', codigoBackend: 'DASHBOARD', icon: 'bi bi-speedometer2', permisosDisponibles: ['ver'] },
      { nombre: 'Aulas', key: 'aulas', codigoBackend: 'AULAS', icon: 'bi bi-door-open', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Alumnos', key: 'alumnos', codigoBackend: 'ALUMNOS', icon: 'bi bi-mortarboard', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Conceptos', key: 'conceptos', codigoBackend: 'CONCEPTOS', icon: 'bi bi-receipt', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Registrar Matrícula', key: 'registrar-matricula', codigoBackend: 'MATRICULA_REGISTRAR', icon: 'bi bi-file-text', permisosDisponibles: ['ver', 'crear'] },
    ],
  },
  {
    nombre: 'Pagos', key: 'pagos', icon: 'bi bi-credit-card', codigoBackend: 'PAGOS',
    hijos: [
      { nombre: 'Registrar Pago', key: 'registrar-pago', codigoBackend: 'PAGO_REGISTRAR', icon: 'bi bi-cash', permisosDisponibles: ['ver', 'crear'] },
      { nombre: 'Historial de Deudas', key: 'historial-deudas', codigoBackend: 'DEUDA_HISTORIAL', icon: 'bi bi-clock-history', permisosDisponibles: ['ver'] },
    ],
  },
  {
    nombre: 'Auditoría', key: 'auditoria', icon: 'bi bi-search', codigoBackend: 'AUDITORIA',
    hijos: [
      { nombre: 'Registro de Auditoría', key: 'registro-auditoria', codigoBackend: 'AUDITORIA_REGISTRO', icon: 'bi bi-list-check', permisosDisponibles: ['ver', 'imprimir'] },
    ],
  },
  {
    nombre: 'Reportes', key: 'reportes', icon: 'bi bi-file-earmark-bar-graph', codigoBackend: 'REPORTES',
    hijos: [
      { nombre: 'Reporte de Matrícula', key: 'reporte-matricula', codigoBackend: 'REPORTE_MATRICULA', icon: 'bi bi-file-text', permisosDisponibles: ['ver', 'imprimir'] },
      { nombre: 'Reporte de Vacantes', key: 'reporte-vacantes', codigoBackend: 'REPORTE_VACANTES', icon: 'bi bi-door-open', permisosDisponibles: ['ver', 'imprimir'] },
      { nombre: 'Reporte de Deudas', key: 'reporte-deudas', codigoBackend: 'REPORTE_DEUDAS', icon: 'bi bi-cash-stack', permisosDisponibles: ['ver', 'imprimir'] },
      { nombre: 'Reporte de Caja', key: 'reporte-caja', codigoBackend: 'REPORTE_CAJA', icon: 'bi bi-cash-coin', permisosDisponibles: ['ver', 'imprimir'] },
    ],
  },
];

export type ItemPlano =
  | { tipo: 'grupo'; nombre: string; key: string; icon: string; depth: number }
  | { tipo: 'subgrupo'; nombre: string; key: string; icon: string; depth: number; parentKey: string }
  | { tipo: 'hoja'; nombre: string; key: string; icon: string; depth: number; parentKey: string; permisosDisponibles: string[]; readonly?: boolean }
  | { tipo: 'permiso'; nombre: string; key: string; permKey: string; depth: number; parentKey: string };

function pushPermisos(result: ItemPlano[], h: RamaPermiso, depth: number, parentKey: string): void {
  for (const p of (h.permisosDisponibles ?? [])) {
    result.push({
      tipo: 'permiso',
      nombre: PERMISO_LABELS[p] || p,
      key: `${h.key}/${p}`,
      permKey: p,
      depth,
      parentKey,
    });
  }
}

export function aplanarArbol(nodos: RamaPermiso[], depth = 0, parentKey = ''): ItemPlano[] {
  const result: ItemPlano[] = [];
  for (const n of nodos) {
    if (n.hijos) {
      result.push({ tipo: 'grupo', nombre: n.nombre, key: n.key, icon: n.icon, depth });
      for (const h of n.hijos) {
        if (h.hijos) {
          result.push({ tipo: 'subgrupo', nombre: h.nombre, key: h.key, icon: h.icon, depth: depth + 1, parentKey: n.key });
          for (const sub of h.hijos) {
            result.push({ tipo: 'hoja', nombre: sub.nombre, key: sub.key, icon: sub.icon, depth: depth + 2, parentKey: h.key, permisosDisponibles: sub.permisosDisponibles ?? [], readonly: sub.readonly });
            if (!sub.readonly) pushPermisos(result, sub, depth + 3, sub.key);
          }
        } else {
          result.push({ tipo: 'hoja', nombre: h.nombre, key: h.key, icon: h.icon, depth: depth + 1, parentKey: n.key, permisosDisponibles: h.permisosDisponibles ?? [], readonly: h.readonly });
          if (!h.readonly) pushPermisos(result, h, depth + 2, h.key);
        }
      }
    }
  }
  return result;
}

export function obtenerClavesGrupo(nodos: RamaPermiso[]): string[] {
  const keys: string[] = [];
  for (const n of nodos) {
    if (n.hijos) {
      keys.push(n.key);
      for (const h of n.hijos) {
        if (h.hijos) {
          keys.push(h.key);
        }
      }
    }
  }
  return keys;
}

export function obtenerHojas(nodos: RamaPermiso[]): RamaPermiso[] {
  const hojas: RamaPermiso[] = [];
  for (const n of nodos) {
    if (n.hijos) {
      for (const h of n.hijos) {
        if (h.hijos) {
          for (const sub of h.hijos) {
            hojas.push(sub);
          }
        } else {
          hojas.push(h);
        }
      }
    }
  }
  return hojas;
}

export const LEAF_KEY_TO_BACKEND_CODE: Record<string, string> = {};
for (const h of obtenerHojas(ARBOL_PERMISOS)) {
  if (h.codigoBackend) {
    LEAF_KEY_TO_BACKEND_CODE[h.key] = h.codigoBackend;
  }
}

export const BACKEND_CODE_TO_LEAF_KEY: Record<string, string> = {};
for (const [leafKey, codigo] of Object.entries(LEAF_KEY_TO_BACKEND_CODE)) {
  BACKEND_CODE_TO_LEAF_KEY[codigo] = leafKey;
}
