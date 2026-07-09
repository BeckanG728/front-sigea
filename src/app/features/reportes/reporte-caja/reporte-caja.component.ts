import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-reporte-caja',
  standalone: true,
  imports: [],
  templateUrl: './reporte-caja.html',
})
export class ReporteCajaComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Reporte de Caja');
    this.shellState.icon.set('bi bi-cash-coin');
  }
}
