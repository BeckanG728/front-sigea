import { Component, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-director-alumnos',
  standalone: true,
  imports: [],
  templateUrl: './director-alumnos.html',
})
export class DirectorAlumnosComponent {
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor(private data: DataService) {
    this.shellState.title.set('Alumnos');
    this.shellState.icon.set('bi bi-mortarboard');
  }

  protected get alumnos() { return this.data.alumnosAula4; }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      activa: 'badge badge--success',
      activo: 'badge badge--success',
      pendiente: 'badge badge--warning',
      pagado: 'badge badge--success',
      pagar: 'badge badge--warning',
      bloqueado: 'badge badge--neutral',
      trasladada: 'badge badge--info',
      deuda: 'badge badge--danger',
      eliminado: 'badge badge--danger',
    };
    return map[estado] || 'badge badge--neutral';
  }
}
