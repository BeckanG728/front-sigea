import { MenuEntry } from '../models/menu.model';

export function getSuperusuarioMenu(): MenuEntry[] {
  return [
    {
      type: 'group', group: 'Seguridad', dataGroup: 'seguridad',
      icon: 'bi bi-shield-lock',
      children: [
        { icon: 'bi bi-people', label: 'Usuarios', route: '/su/usuarios' },
        { icon: 'bi bi-person-badge', label: 'Roles', route: '/su/roles' },
        { icon: 'bi bi-sliders', label: 'Parámetros', route: '/su/parametros' },
        { icon: 'bi bi-key', label: 'Mi cuenta', route: '/su/clave' },
      ],
    },
    {
      type: 'group', group: 'Académico', dataGroup: 'academico',
      icon: 'bi bi-book',
      children: [
        { icon: 'bi bi-door-open', label: 'Aulas', route: '/su/aulas' },
        { icon: 'bi bi-mortarboard', label: 'Alumnos', route: '/su/alumnos' },
        { icon: 'bi bi-receipt', label: 'Conceptos', route: '/su/conceptos' },
        { icon: 'bi bi-pencil-square', label: 'Registrar Matrícula', route: '/su/matricula/registrar' },
      ],
    },
    {
      type: 'group', group: 'Pagos', dataGroup: 'pagos',
      icon: 'bi bi-credit-card',
      children: [
        { icon: 'bi bi-cash', label: 'Registrar Pago', route: '/su/pagos/registrar' },
        { icon: 'bi bi-clock-history', label: 'Historial de Deudas', route: '/su/pagos/deudas' },
      ],
    },
    {
      type: 'group', group: 'Auditoría', dataGroup: 'auditoria',
      icon: 'bi bi-search',
      children: [
        { icon: 'bi bi-list-check', label: 'Registro de Auditoría', route: '/auditoria' },
      ],
    },
    {
      type: 'group', group: 'Reportes', dataGroup: 'reportes',
      icon: 'bi bi-file-earmark-bar-graph',
      children: [
        { icon: 'bi bi-file-text', label: 'Reporte de Matrícula', route: '/reportes/matricula' },
        { icon: 'bi bi-door-open', label: 'Reporte de Vacantes', route: '/reportes/vacantes' },
        { icon: 'bi bi-cash-stack', label: 'Reporte de Deudas', route: '/reportes/deudas' },
        { icon: 'bi bi-cash-coin', label: 'Reporte de Caja', route: '/reportes/caja' },
      ],
    },
  ];
}

export function getDirectorMenu(): MenuEntry[] {
  return [
    {
      type: 'group', group: 'Académico', dataGroup: 'academico',
      icon: 'bi bi-book',
      children: [
        { icon: 'bi bi-building', label: 'Panel director', route: '/director' },
        { icon: 'bi bi-door-open', label: 'Aulas', route: '/director/aulas' },
        { icon: 'bi bi-mortarboard', label: 'Alumnos', route: '/director/alumnos' },
        { icon: 'bi bi-pencil-square', label: 'Registrar Matrícula', route: '/director/matricula/registrar' },
      ],
    },
    {
      type: 'group', group: 'Seguridad', dataGroup: 'seguridad',
      icon: 'bi bi-shield-lock',
      children: [
        { icon: 'bi bi-shield-check', label: 'Mi cuenta', route: '/director/clave' },
      ],
    },
  ];
}

export function getSecretariaMenu(): MenuEntry[] {
  return [
    {
      type: 'group', group: 'Académico', dataGroup: 'academico',
      icon: 'bi bi-book',
      children: [
        { icon: 'bi bi-door-open', label: 'Aulas', route: '/secretaria/aulas' },
        { icon: 'bi bi-mortarboard', label: 'Alumnos', route: '/secretaria/alumnos' },
        { icon: 'bi bi-receipt', label: 'Conceptos', route: '/secretaria/conceptos' },
        { icon: 'bi bi-pencil-square', label: 'Registrar Matrícula', route: '/secretaria/matricula/registrar' },
      ],
    },
    {
      type: 'group', group: 'Pagos', dataGroup: 'pagos',
      icon: 'bi bi-credit-card',
      children: [
        { icon: 'bi bi-cash', label: 'Registrar Pago', route: '/secretaria/pagos/registrar' },
        { icon: 'bi bi-clock-history', label: 'Historial de Deudas', route: '/secretaria/pagos/deudas' },
      ],
    },
    {
      type: 'group', group: 'Seguridad', dataGroup: 'seguridad',
      icon: 'bi bi-shield-lock',
      children: [
        { icon: 'bi bi-shield-check', label: 'Mi cuenta', route: '/secretaria/clave' },
      ],
    },
  ];
}

export function getMenuForRole(roleKey: string | undefined): MenuEntry[] {
  switch (roleKey) {
    case 'superusuario': return getSuperusuarioMenu();
    case 'director':     return getDirectorMenu();
    default:             return getSecretariaMenu();
  }
}
