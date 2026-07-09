import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-reporte-matricula',
  standalone: true,
  imports: [],
  templateUrl: './reporte-matricula.html',
})
export class ReporteMatriculaComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Reporte de Matrícula');
    this.shellState.icon.set('bi bi-file-text');
  }
}
