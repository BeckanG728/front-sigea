import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function funcionalidadGuard(codigo: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.parseUrl('/login');
    }

    if (auth.role()?.key === 'superusuario') {
      return true;
    }

    if (auth.tieneCodigoFuncionalidad(codigo)) {
      return true;
    }

    return router.parseUrl(auth.homeRoute);
  };
}