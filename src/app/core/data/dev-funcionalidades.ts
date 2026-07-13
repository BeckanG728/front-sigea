import { FuncionalidadNode, FULL_PERMISOS, getIcon } from '../models/funcionalidad.model';

export function getSuperusuarioTree(): FuncionalidadNode[] {
  return [
    {
      idFuncionalidad: 1, codigo: 'SEGURIDAD', nombre: 'Seguridad', icon: getIcon('Seguridad'),
      permisos: FULL_PERMISOS,
      hijos: [
        { idFuncionalidad: 10, codigo: 'USUARIOS', nombre: 'Usuarios', ruta: '/su/usuarios', icon: getIcon('Usuarios'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 12, codigo: 'ROLES', nombre: 'Roles', ruta: '/su/roles', icon: getIcon('Roles'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 13, codigo: 'PARAMETROS', nombre: 'Parámetros', ruta: '/su/parametros', icon: getIcon('Parámetros'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 14, codigo: 'MI_CUENTA', nombre: 'Mi Cuenta', ruta: '/su/clave', icon: getIcon('Mi Cuenta'), permisos: FULL_PERMISOS },
      ],
    },
    {
      idFuncionalidad: 2, codigo: 'ACADEMICO', nombre: 'Académico', icon: getIcon('Académico'),
      permisos: FULL_PERMISOS,
      hijos: [
        { idFuncionalidad: 20, codigo: 'AULAS', nombre: 'Aulas', ruta: '/su/aulas', icon: getIcon('Aulas'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 21, codigo: 'ALUMNOS', nombre: 'Alumnos', ruta: '/su/alumnos', icon: getIcon('Alumnos'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 22, codigo: 'CONCEPTOS', nombre: 'Conceptos', ruta: '/su/conceptos', icon: getIcon('Conceptos'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 23, codigo: 'MATRICULA_REGISTRAR', nombre: 'Registrar Matrícula', ruta: '/su/matricula/registrar', icon: getIcon('Registrar Matrícula'), permisos: FULL_PERMISOS },
      ],
    },
    {
      idFuncionalidad: 3, codigo: 'PAGOS', nombre: 'Pagos', icon: getIcon('Pagos'),
      permisos: FULL_PERMISOS,
      hijos: [
        { idFuncionalidad: 30, codigo: 'PAGO_REGISTRAR', nombre: 'Registrar Pago', ruta: '/su/pagos/registrar', icon: getIcon('Registrar Pago'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 31, codigo: 'DEUDA_HISTORIAL', nombre: 'Historial de Deudas', ruta: '/su/pagos/deudas', icon: getIcon('Historial de Deudas'), permisos: FULL_PERMISOS },
      ],
    },
    {
      idFuncionalidad: 4, codigo: 'AUDITORIA', nombre: 'Auditoría', icon: getIcon('Auditoría'),
      permisos: FULL_PERMISOS,
      hijos: [
        { idFuncionalidad: 40, codigo: 'AUDITORIA_REGISTRO', nombre: 'Registro de Auditoría', ruta: '/auditoria', icon: getIcon('Registro de Auditoría'), permisos: FULL_PERMISOS },
      ],
    },
    {
      idFuncionalidad: 5, codigo: 'REPORTES', nombre: 'Reportes', icon: getIcon('Reportes'),
      permisos: FULL_PERMISOS,
      hijos: [
        { idFuncionalidad: 50, codigo: 'REPORTE_MATRICULA', nombre: 'Reporte de Matrícula', ruta: '/reportes/matricula', icon: getIcon('Reporte de Matrícula'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 51, codigo: 'REPORTE_VACANTES', nombre: 'Reporte de Vacantes', ruta: '/reportes/vacantes', icon: getIcon('Reporte de Vacantes'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 52, codigo: 'REPORTE_DEUDAS', nombre: 'Reporte de Deudas', ruta: '/reportes/deudas', icon: getIcon('Reporte de Deudas'), permisos: FULL_PERMISOS },
        { idFuncionalidad: 53, codigo: 'REPORTE_CAJA', nombre: 'Reporte de Caja', ruta: '/reportes/caja', icon: getIcon('Reporte de Caja'), permisos: FULL_PERMISOS },
      ],
    },
  ];
}

export function getDirectorTree(): FuncionalidadNode[] {
  const readVer = { ver: true, crear: false, editar: false, eliminar: false, imprimir: false };
  return [
    {
      idFuncionalidad: 100, codigo: 'ACADEMICO', nombre: 'Académico', icon: getIcon('Académico'),
      permisos: readVer,
      hijos: [
        { idFuncionalidad: 101, codigo: 'DASHBOARD', nombre: 'Dashboard', ruta: '/director/dashboard', icon: getIcon('Dashboard'), permisos: readVer },
        { idFuncionalidad: 102, codigo: 'AULAS', nombre: 'Aulas', ruta: '/director/aulas', icon: getIcon('Aulas'), permisos: readVer },
        { idFuncionalidad: 103, codigo: 'ALUMNOS', nombre: 'Alumnos', ruta: '/director/alumnos', icon: getIcon('Alumnos'), permisos: readVer },
        { idFuncionalidad: 104, codigo: 'MATRICULA_REGISTRAR', nombre: 'Registrar Matrícula', ruta: '/director/matricula/registrar', icon: getIcon('Registrar Matrícula'), permisos: readVer },
      ],
    },
    {
      idFuncionalidad: 110, codigo: 'SEGURIDAD', nombre: 'Seguridad', icon: getIcon('Seguridad'),
      permisos: readVer,
      hijos: [
        { idFuncionalidad: 111, codigo: 'MI_CUENTA', nombre: 'Mi Cuenta', ruta: '/director/clave', icon: getIcon('Mi Cuenta'), permisos: readVer },
      ],
    },
  ];
}

export function getSecretariaTree(): FuncionalidadNode[] {
  const rwPermisos = { ver: true, crear: true, editar: true, eliminar: true, imprimir: false };
  return [
    {
      idFuncionalidad: 200, codigo: 'ACADEMICO', nombre: 'Académico', icon: getIcon('Académico'),
      permisos: rwPermisos,
      hijos: [
        { idFuncionalidad: 201, codigo: 'AULAS', nombre: 'Aulas', ruta: '/secretaria/aulas', icon: getIcon('Aulas'), permisos: rwPermisos },
        { idFuncionalidad: 202, codigo: 'ALUMNOS', nombre: 'Alumnos', ruta: '/secretaria/alumnos', icon: getIcon('Alumnos'), permisos: rwPermisos },
        { idFuncionalidad: 203, codigo: 'CONCEPTOS', nombre: 'Conceptos', ruta: '/secretaria/conceptos', icon: getIcon('Conceptos'), permisos: rwPermisos },
        { idFuncionalidad: 204, codigo: 'MATRICULA_REGISTRAR', nombre: 'Registrar Matrícula', ruta: '/secretaria/matricula/registrar', icon: getIcon('Registrar Matrícula'), permisos: rwPermisos },
      ],
    },
    {
      idFuncionalidad: 210, codigo: 'PAGOS', nombre: 'Pagos', icon: getIcon('Pagos'),
      permisos: rwPermisos,
      hijos: [
        { idFuncionalidad: 211, codigo: 'PAGO_REGISTRAR', nombre: 'Registrar Pago', ruta: '/secretaria/pagos/registrar', icon: getIcon('Registrar Pago'), permisos: rwPermisos },
        { idFuncionalidad: 212, codigo: 'DEUDA_HISTORIAL', nombre: 'Historial de Deudas', ruta: '/secretaria/pagos/deudas', icon: getIcon('Historial de Deudas'), permisos: rwPermisos },
      ],
    },
    {
      idFuncionalidad: 220, codigo: 'SEGURIDAD', nombre: 'Seguridad', icon: getIcon('Seguridad'),
      permisos: rwPermisos,
      hijos: [
        { idFuncionalidad: 221, codigo: 'MI_CUENTA', nombre: 'Mi Cuenta', ruta: '/secretaria/clave', icon: getIcon('Mi Cuenta'), permisos: rwPermisos },
      ],
    },
  ];
}

export function getDevTreeForRole(roleKey: string | undefined): FuncionalidadNode[] | null {
  switch (roleKey) {
    case 'superusuario': return getSuperusuarioTree();
    case 'director': return getDirectorTree();
    case 'secretaria': return getSecretariaTree();
    default: return null;
  }
}
