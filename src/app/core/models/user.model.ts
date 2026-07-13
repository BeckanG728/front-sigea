export interface User {
  id: number;
  nombre: string;
  nombreSolo: string;
  apellido: string;
  doc: string;
  rol: string;
  estado: string;
  noEliminable?: boolean;
  bloqueado: boolean;
  permisosVisibles: boolean;
  secreto2FA: string | null;
}
