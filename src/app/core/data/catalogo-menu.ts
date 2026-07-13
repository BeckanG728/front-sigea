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

  USUARIOS:            { ruta: ':prefix/usuarios',          icono: 'bi bi-people' },
  ROLES:               { ruta: ':prefix/roles',             icono: 'bi bi-person-badge' },
  PARAMETROS:          { ruta: ':prefix/parametros',        icono: 'bi bi-sliders' },
  MI_CUENTA:           { ruta: ':prefix/clave',             icono: 'bi bi-key' },
  AULAS:               { ruta: ':prefix/aulas',             icono: 'bi bi-door-open' },
  ALUMNOS:             { ruta: ':prefix/alumnos',           icono: 'bi bi-mortarboard' },
  CONCEPTOS:           { ruta: ':prefix/conceptos',         icono: 'bi bi-receipt' },
  MATRICULA_REGISTRAR: { ruta: ':prefix/matricula/registrar', icono: 'bi bi-file-text' },
  PAGO_REGISTRAR:      { ruta: ':prefix/pagos/registrar',  icono: 'bi bi-cash' },
  DEUDA_HISTORIAL:     { ruta: ':prefix/pagos/deudas',     icono: 'bi bi-clock-history' },
  AUDITORIA_REGISTRO:  { ruta: '/auditoria',                icono: 'bi bi-list-check' },
  REPORTE_MATRICULA:   { ruta: '/reportes/matricula',      icono: 'bi bi-file-text' },
  REPORTE_VACANTES:    { ruta: '/reportes/vacantes',       icono: 'bi bi-door-open' },
  REPORTE_DEUDAS:      { ruta: '/reportes/deudas',         icono: 'bi bi-cash-stack' },
  REPORTE_CAJA:        { ruta: '/reportes/caja',           icono: 'bi bi-cash-coin' },

  PANEL_DIRECTOR:      { ruta: ':prefix',                   icono: 'bi bi-building' },
};
