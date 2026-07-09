import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-reporte-vacantes',
  standalone: true,
  imports: [],
  templateUrl: './reporte-vacantes.html',
})
export class ReporteVacantesComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Reporte de Vacantes');
    this.shellState.icon.set('bi bi-door-open');
  }
}
