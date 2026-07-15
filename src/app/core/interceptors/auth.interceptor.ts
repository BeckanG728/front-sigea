import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const skipAuth = req.url.includes('/auth/login');
  if (!skipAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
  }
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 && err.error?.error !== 'INVALID_CREDENTIALS') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
