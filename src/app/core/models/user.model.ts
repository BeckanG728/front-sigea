export interface User {
  id: number;
  nombre: string;
  username: string;
  doc: string;
  rol: string;
  estado: string;
  noEliminable?: boolean;
  bloqueado: boolean;
  permisosVisibles: boolean;
  dosFactorActivo: boolean;
  secreto2FA: string | null;
}
