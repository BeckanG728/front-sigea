import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { funcionalidadGuard } from './core/guards/funcionalidad.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [

      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./shared/panel-inicio/panel-inicio.component')
            .then(m => m.PanelInicioComponent)
      },

      {
        path: 'dashboard',
        canActivate: [funcionalidadGuard('DASHBOARD')],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'usuarios',
        canActivate: [funcionalidadGuard('USUARIOS')],
        loadComponent: () =>
          import('./features/superusuario/usuarios/usuarios.component')
            .then(m => m.UsuariosComponent)
      },

      {
        path: 'roles',
        canActivate: [funcionalidadGuard('ROLES')],
        loadComponent: () =>
          import('./features/superusuario/permisos/permisos.component')
            .then(m => m.PermisosComponent)
      },

      {
        path: 'parametros',
        canActivate: [funcionalidadGuard('PARAMETROS')],
        loadComponent: () =>
          import('./features/superusuario/parametros/parametros.component')
            .then(m => m.ParametrosComponent)
      },

      {
        path: 'aulas',
        canActivate: [funcionalidadGuard('AULAS')],
        loadComponent: () =>
          import('./features/aulas/aulas.component')
            .then(m => m.AulasComponent)
      },

      {
        path: 'alumnos',
        canActivate: [funcionalidadGuard('ALUMNOS')],
        loadComponent: () =>
          import('./features/alumnos/alumnos.component')
            .then(m => m.AlumnosComponent)
      },

      {
        path: 'conceptos',
        canActivate: [funcionalidadGuard('CONCEPTOS')],
        loadComponent: () =>
          import('./features/conceptos/conceptos.component')
            .then(m => m.ConceptosComponent)
      },

      {
        path: 'matricula',
        canActivate: [authGuard],
        children: [
          {
            path: 'registrar',
            canActivate: [funcionalidadGuard('MATRICULA_REGISTRAR')],
            loadComponent: () =>
              import('./features/matricula/registrar-matricula/registrar-matricula.component')
                .then(m => m.RegistrarMatriculaComponent)
          }
        ]
      },

      {
        path: 'pagos',
        canActivate: [authGuard],
        children: [
          {
            path: 'registrar',
            canActivate: [funcionalidadGuard('PAGO_REGISTRAR')],
            loadComponent: () =>
              import('./features/pagos/registrar-pago/registrar-pago.component')
                .then(m => m.RegistrarPagoComponent)
          },
          {
            path: 'deudas',
            canActivate: [funcionalidadGuard('DEUDA_HISTORIAL')],
            loadComponent: () =>
              import('./features/pagos/historial-deudas/historial-deudas.component')
                .then(m => m.HistorialDeudasComponent)
          }
        ]
      },

      {
        path: 'reportes',
        canActivate: [authGuard],
        children: [
          {
            path: 'matricula',
            canActivate: [funcionalidadGuard('REPORTE_MATRICULA')],
            loadComponent: () =>
              import('./features/reportes/reporte-matricula/reporte-matricula.component')
                .then(m => m.ReporteMatriculaComponent)
          },

          {
            path: 'vacantes',
            canActivate: [funcionalidadGuard('REPORTE_VACANTES')],
            loadComponent: () =>
              import('./features/reportes/reporte-vacantes/reporte-vacantes.component')
                .then(m => m.ReporteVacantesComponent)
          },

          {
            path: 'deudas',
            canActivate: [funcionalidadGuard('REPORTE_DEUDAS')],
            loadComponent: () =>
              import('./features/reportes/reporte-deudas/reporte-deudas.component')
                .then(m => m.ReporteDeudasComponent)
          },

          {
            path: 'caja',
            canActivate: [funcionalidadGuard('REPORTE_CAJA')],
            loadComponent: () =>
              import('./features/reportes/reporte-caja/reporte-caja.component')
                .then(m => m.ReporteCajaComponent)
          }
        ]
      },

      {
        path: 'clave',
        canActivate: [funcionalidadGuard('CAMBIAR_CLAVE')],
        loadComponent: () =>
          import('./features/login/change-password/change-password.component')
            .then(m => m.ChangePasswordComponent)
      },

      {
        path: 'auditoria',
        canActivate: [funcionalidadGuard('AUDITORIA')],
        loadComponent: () =>
          import('./features/auditoria/auditoria.component')
            .then(m => m.AuditoriaComponent)
      }

    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];