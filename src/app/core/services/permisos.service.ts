import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { DataService, PermisoMap } from './data.service';

@Injectable({ providedIn: 'root' })
export class PermisosService {
  constructor(
    private auth: AuthService,
    private data: DataService
  ) {}

  getPermisosModulo(modKey: string): PermisoMap {
    const role = this.auth.role();
    if (!role) return {};
    const rolPermisos = this.data.permisosPorRol();
    const modPermisos = rolPermisos[role.key]?.[modKey];
    return modPermisos || {};
  }

  puede(modKey: string, accion: string): boolean {
    return !!this.getPermisosModulo(modKey)[accion];
  }
}
