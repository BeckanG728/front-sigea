export interface RoleInfo {
  key: string;
  label: string;
  initials: string;
  css: string;
  badgeLabel: string;
}

export const ROLES: Record<string, RoleInfo> = {

  superusuario: {
    key: 'superusuario',
    label: 'Superusuario',
    initials: 'SU',
    css: 'su',
    badgeLabel: 'acceso total'
  },

  director: {
    key: 'director',
    label: 'Director',
    initials: 'DI',
    css: 'director',
    badgeLabel: 'solo lectura'
  },

  secretaria: {
    key: 'secretaria',
    label: 'Secretaria',
    initials: 'SE',
    css: 'secretaria',
    badgeLabel: 'operaciones'
  }

};


export const ROLE_KEY_MAP: Record<string, string> = {

  SUPERUSUARIO: 'superusuario',
  DIRECTOR: 'director',
  SECRETARIA: 'secretaria'

};