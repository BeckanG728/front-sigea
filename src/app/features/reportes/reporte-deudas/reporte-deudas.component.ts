import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-reporte-deudas',
  standalone: true,
  imports: [],
  templateUrl: './reporte-deudas.html',
})
export class ReporteDeudasComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Reporte de Deudas');
    this.shellState.icon.set('bi bi-cash-stack');
  }
}
