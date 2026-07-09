export interface RoleInfo {
  key: string;
  routePrefix: string;
  label: string;
  initials: string;
  css: string;
  badgeLabel: string;
}

export const ROLES: Record<string, RoleInfo> = {
  superusuario: { key: 'superusuario', routePrefix: 'su', label: 'Superusuario', initials: 'SU', css: 'su', badgeLabel: 'acceso total' },
  director: { key: 'director', routePrefix: 'director', label: 'Director', initials: 'DI', css: 'director', badgeLabel: 'solo lectura' },
  secretaria: { key: 'secretaria', routePrefix: 'secretaria', label: 'Secretaria', initials: 'SE', css: 'secretaria', badgeLabel: 'operaciones' },
};
