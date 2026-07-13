import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { PermisoMap } from '../models/permiso.model';
import type { FuncionalidadNode } from '../models/funcionalidad.model';

@Injectable({ providedIn: 'root' })
export class PermisosService {
  constructor(
    private auth: AuthService,
  ) {}

  getPermisosModulo(modKey: string): PermisoMap {
    const tree = this.auth.funcionalidades();
    if (!tree) return {};
    const node = this.buscarEnArbol(tree, modKey);
    return (node?.permisos ?? {}) as PermisoMap;
  }

  puede(modKey: string, accion: string): boolean {
    return !!this.getPermisosModulo(modKey)[accion];
  }

  private buscarEnArbol(nodos: FuncionalidadNode[], modKey: string): FuncionalidadNode | null {
    const lowerKey = modKey.toLowerCase();
    for (const n of nodos) {
      if (n.codigo.toLowerCase() === lowerKey || n.nombre.toLowerCase() === lowerKey) {
        return n;
      }
      for (const h of n.hijos ?? []) {
        if (h.codigo.toLowerCase() === lowerKey || h.nombre.toLowerCase() === lowerKey) {
          return h;
        }
        for (const sub of h.hijos ?? []) {
          if (sub.codigo.toLowerCase() === lowerKey || sub.nombre.toLowerCase() === lowerKey) {
            return sub;
          }
        }
      }
    }
    return null;
  }
}
