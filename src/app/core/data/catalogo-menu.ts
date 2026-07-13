export interface CatalogoEntry {
  ruta?: string;
  icono: string;
}

export const CATALOGO_MENU: Record<string, CatalogoEntry> = {
  SEGURIDAD:           { icono: 'bi bi-shield-lock' },
  ACADEMICO:           { icono: 'bi bi-book' },
  PAGOS:               { icono: 'bi bi-credit-card' },
  AUDITORIA:           { icono: 'bi bi-search' },
  REPORTES:            { icono: 'bi bi-file-earmark-bar-graph' },

  USUARIOS:            { ruta: '/usuarios',              icono: 'bi bi-people' },
  ROLES:               { ruta: '/roles',                 icono: 'bi bi-person-badge' },
  PARAMETROS:          { ruta: '/parametros',             icono: 'bi bi-sliders' },
  MI_CUENTA:           { ruta: '/clave',                  icono: 'bi bi-key' },

  AULAS:               { ruta: '/aulas',                  icono: 'bi bi-door-open' },
  ALUMNOS:             { ruta: '/alumnos',                icono: 'bi bi-mortarboard' },
  CONCEPTOS:           { ruta: '/conceptos',              icono: 'bi bi-receipt' },

  MATRICULA_REGISTRAR: { ruta: '/matricula/registrar',     icono: 'bi bi-file-text' },

  PAGO_REGISTRAR:      { ruta: '/pagos/registrar',         icono: 'bi bi-cash' },
  DEUDA_HISTORIAL:     { ruta: '/pagos/deudas',            icono: 'bi bi-clock-history' },

  AUDITORIA_REGISTRO:  { ruta: '/auditoria',               icono: 'bi bi-list-check' },

  REPORTE_MATRICULA:   { ruta: '/reportes/matricula',      icono: 'bi bi-file-text' },
  REPORTE_VACANTES:    { ruta: '/reportes/vacantes',       icono: 'bi bi-door-open' },
  REPORTE_DEUDAS:      { ruta: '/reportes/deudas',         icono: 'bi bi-cash-stack' },
  REPORTE_CAJA:        { ruta: '/reportes/caja',           icono: 'bi bi-cash-coin' },

  DASHBOARD:           { ruta: '/dashboard',               icono: 'bi bi-speedometer2' },
};