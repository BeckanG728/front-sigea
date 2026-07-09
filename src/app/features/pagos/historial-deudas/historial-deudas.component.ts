import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-historial-deudas',
  standalone: true,
  imports: [],
  templateUrl: './historial-deudas.html',
})
export class HistorialDeudasComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Historial de Deudas');
    this.shellState.icon.set('bi bi-clock-history');
  }
}
