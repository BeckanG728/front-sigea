export interface RamaPermiso {
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
    nombre: 'Seguridad', key: 'seguridad', icon: 'bi bi-shield-lock',
    hijos: [
      { nombre: 'Usuarios', key: 'usuarios', icon: 'bi bi-people', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Roles', key: 'roles', icon: 'bi bi-person-badge', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Permisos', key: 'permisos', icon: 'bi bi-lock', permisosDisponibles: ['ver', 'editar'] },
      { nombre: 'Parámetros', key: 'parametros', icon: 'bi bi-sliders', permisosDisponibles: ['ver', 'editar'] },
      { nombre: 'Mi Cuenta', key: 'mi-cuenta', icon: 'bi bi-key', readonly: true },
    ],
  },
  {
    nombre: 'Académico', key: 'academico', icon: 'bi bi-book',
    hijos: [
      { nombre: 'Aulas', key: 'aulas', icon: 'bi bi-door-open', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Alumnos', key: 'alumnos', icon: 'bi bi-mortarboard', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      { nombre: 'Conceptos', key: 'conceptos', icon: 'bi bi-receipt', permisosDisponibles: ['ver', 'crear', 'editar', 'eliminar'] },
      {
        nombre: 'Matrícula', key: 'matricula', icon: 'bi bi-pencil-square',
        hijos: [
          { nombre: 'Registrar Matrícula', key: 'registrar-matricula', icon: 'bi bi-file-text', permisosDisponibles: ['ver', 'crear'] },
        ],
      },
    ],
  },
  {
    nombre: 'Pagos', key: 'pagos', icon: 'bi bi-credit-card',
    hijos: [
      { nombre: 'Registrar Pago', key: 'registrar-pago', icon: 'bi bi-cash', permisosDisponibles: ['ver', 'crear'] },
      { nombre: 'Historial de Deudas', key: 'historial-deudas', icon: 'bi bi-clock-history', permisosDisponibles: ['ver'] },
    ],
  },
  {
    nombre: 'Auditoría', key: 'auditoria', icon: 'bi bi-search',
    hijos: [
      { nombre: 'Registro de Auditoría', key: 'registro-auditoria', icon: 'bi bi-list-check', permisosDisponibles: ['ver', 'imprimir'] },
    ],
  },
  {
    nombre: 'Reportes', key: 'reportes', icon: 'bi bi-file-earmark-bar-graph',
    hijos: [
      { nombre: 'Reporte de Matrícula', key: 'reporte-matricula', icon: 'bi bi-file-text', permisosDisponibles: ['ver', 'imprimir'] },
      { nombre: 'Reporte de Vacantes', key: 'reporte-vacantes', icon: 'bi bi-door-open', permisosDisponibles: ['ver', 'imprimir'] },
      { nombre: 'Reporte de Deudas', key: 'reporte-deudas', icon: 'bi bi-cash-stack', permisosDisponibles: ['ver', 'imprimir'] },
      { nombre: 'Reporte de Caja', key: 'reporte-caja', icon: 'bi bi-cash-coin', permisosDisponibles: ['ver', 'imprimir'] },
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
