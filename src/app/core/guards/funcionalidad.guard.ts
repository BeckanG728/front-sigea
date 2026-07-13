import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function funcionalidadGuard(ruta: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) {
      return router.parseUrl('/login');
    }
    if (auth.role()?.key === 'superusuario') {
      return true;
    }
    if (auth.tieneFuncionalidad(ruta)) {
      return true;
    }
    // Evita un bucle infinito de redirecciones si la propia homeRoute
    // no tiene una funcionalidad asignada (p. ej. permiso no sembrado en backend).
    if (ruta === auth.homeRoute) {
      return router.parseUrl('/login');
    }
    return router.parseUrl(auth.homeRoute);
  };
}
