import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { funcionalidadGuard } from './core/guards/funcionalidad.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: '',
    canActivate: [authGuard],
    component: ShellComponent,
    children: [
      {
        path: 'su',
        canActivate: [roleGuard(['superusuario'])],
        children: [
          {
            path: 'usuarios',
            canActivate: [funcionalidadGuard('/su/usuarios')],
            loadComponent: () =>
              import('./features/superusuario/usuarios/usuarios.component').then(m => m.UsuariosComponent)
          },
          {
            path: 'roles',
            canActivate: [funcionalidadGuard('/su/roles')],
            loadComponent: () =>
              import('./features/superusuario/permisos/permisos.component').then(m => m.PermisosComponent)
          },
          { path: 'permisos', redirectTo: 'roles', pathMatch: 'full' },
          {
            path: 'parametros',
            canActivate: [funcionalidadGuard('/su/parametros')],
            loadComponent: () =>
              import('./features/superusuario/parametros/parametros.component').then(m => m.ParametrosComponent)
          },
          {
            path: 'clave',
            canActivate: [funcionalidadGuard('/su/clave')],
            loadComponent: () =>
              import('./features/login/change-password/change-password.component').then(m => m.ChangePasswordComponent)
          },
          {
            path: 'aulas',
            canActivate: [funcionalidadGuard('/su/aulas')],
            loadComponent: () =>
              import('./features/aulas/aulas.component').then(m => m.AulasComponent)
          },
          {
            path: 'alumnos',
            canActivate: [funcionalidadGuard('/su/alumnos')],
            loadComponent: () =>
              import('./features/alumnos/alumnos.component').then(m => m.AlumnosComponent)
          },
          {
            path: 'conceptos',
            canActivate: [funcionalidadGuard('/su/conceptos')],
            loadComponent: () =>
              import('./features/conceptos/conceptos.component').then(m => m.ConceptosComponent)
          },
          {
            path: 'matricula',
            children: [
              { path: '', redirectTo: 'registrar', pathMatch: 'full' },
              {
                path: 'registrar',
                canActivate: [funcionalidadGuard('/su/matricula/registrar')],
                loadComponent: () =>
                  import('./features/matricula/registrar-matricula/registrar-matricula.component').then(m => m.RegistrarMatriculaComponent)
              },
            ]
          },
          {
            path: 'pagos',
            children: [
              { path: '', redirectTo: 'registrar', pathMatch: 'full' },
              {
                path: 'registrar',
                canActivate: [funcionalidadGuard('/su/pagos/registrar')],
                loadComponent: () =>
                  import('./features/pagos/registrar-pago/registrar-pago.component').then(m => m.RegistrarPagoComponent)
              },
              {
                path: 'deudas',
                canActivate: [funcionalidadGuard('/su/pagos/deudas')],
                loadComponent: () =>
                  import('./features/pagos/historial-deudas/historial-deudas.component').then(m => m.HistorialDeudasComponent)
              },
            ]
          },
        ]
      },

      {
        path: 'director',
        canActivate: [roleGuard(['director'])],
        children: [
          {
            path: '',
            canActivate: [funcionalidadGuard('/director')],
            loadComponent: () =>
              import('./features/director/dashboard/dashboard.component').then(m => m.DirectorDashboardComponent)
          },
          {
            path: 'aulas',
            canActivate: [funcionalidadGuard('/director/aulas')],
            loadComponent: () =>
              import('./features/director/aulas/aulas.component').then(m => m.DirectorAulasComponent)
          },
          {
            path: 'alumnos',
            canActivate: [funcionalidadGuard('/director/alumnos')],
            loadComponent: () =>
              import('./features/director/dashboard/director-alumnos.component').then(m => m.DirectorAlumnosComponent)
          },
          {
            path: 'matricula',
            children: [
              { path: '', redirectTo: 'registrar', pathMatch: 'full' },
              {
                path: 'registrar',
                canActivate: [funcionalidadGuard('/director/matricula/registrar')],
                loadComponent: () =>
                  import('./features/director/dashboard/director-matricula.component').then(m => m.DirectorMatriculaComponent)
              },
            ]
          },
          {
            path: 'clave',
            canActivate: [funcionalidadGuard('/director/clave')],
            loadComponent: () =>
              import('./features/login/change-password/change-password.component').then(m => m.ChangePasswordComponent)
          }
        ]
      },

      {
        path: 'secretaria',
        canActivate: [roleGuard(['secretaria'])],
        children: [
          {
            path: 'aulas',
            canActivate: [funcionalidadGuard('/secretaria/aulas')],
            loadComponent: () =>
              import('./features/aulas/aulas.component').then(m => m.AulasComponent)
          },
          {
            path: 'alumnos',
            canActivate: [funcionalidadGuard('/secretaria/alumnos')],
            loadComponent: () =>
              import('./features/alumnos/alumnos.component').then(m => m.AlumnosComponent)
          },
          {
            path: 'conceptos',
            canActivate: [funcionalidadGuard('/secretaria/conceptos')],
            loadComponent: () =>
              import('./features/conceptos/conceptos.component').then(m => m.ConceptosComponent)
          },
          {
            path: 'matricula',
            children: [
              { path: '', redirectTo: 'registrar', pathMatch: 'full' },
              {
                path: 'registrar',
                canActivate: [funcionalidadGuard('/secretaria/matricula/registrar')],
                loadComponent: () =>
                  import('./features/matricula/registrar-matricula/registrar-matricula.component').then(m => m.RegistrarMatriculaComponent)
              },
            ]
          },
          {
            path: 'pagos',
            children: [
              { path: '', redirectTo: 'registrar', pathMatch: 'full' },
              {
                path: 'registrar',
                canActivate: [funcionalidadGuard('/secretaria/pagos/registrar')],
                loadComponent: () =>
                  import('./features/pagos/registrar-pago/registrar-pago.component').then(m => m.RegistrarPagoComponent)
              },
              {
                path: 'deudas',
                canActivate: [funcionalidadGuard('/secretaria/pagos/deudas')],
                loadComponent: () =>
                  import('./features/pagos/historial-deudas/historial-deudas.component').then(m => m.HistorialDeudasComponent)
              },
            ]
          },
          {
            path: 'clave',
            canActivate: [funcionalidadGuard('/secretaria/clave')],
            loadComponent: () =>
              import('./features/login/change-password/change-password.component').then(m => m.ChangePasswordComponent)
          }
        ]
      },

      {
        path: 'auditoria',
        canActivate: [funcionalidadGuard('/auditoria')],
        loadComponent: () =>
          import('./features/auditoria/auditoria.component').then(m => m.AuditoriaComponent)
      },

      {
        path: 'reportes',
        children: [
          { path: '', redirectTo: 'matricula', pathMatch: 'full' },
          {
            path: 'matricula',
            canActivate: [funcionalidadGuard('/reportes/matricula')],
            loadComponent: () =>
              import('./features/reportes/reporte-matricula/reporte-matricula.component').then(m => m.ReporteMatriculaComponent)
          },
          {
            path: 'vacantes',
            canActivate: [funcionalidadGuard('/reportes/vacantes')],
            loadComponent: () =>
              import('./features/reportes/reporte-vacantes/reporte-vacantes.component').then(m => m.ReporteVacantesComponent)
          },
          {
            path: 'deudas',
            canActivate: [funcionalidadGuard('/reportes/deudas')],
            loadComponent: () =>
              import('./features/reportes/reporte-deudas/reporte-deudas.component').then(m => m.ReporteDeudasComponent)
          },
          {
            path: 'caja',
            canActivate: [funcionalidadGuard('/reportes/caja')],
            loadComponent: () =>
              import('./features/reportes/reporte-caja/reporte-caja.component').then(m => m.ReporteCajaComponent)
          },
        ]
      },
    ]
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
