import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-registrar-pago',
  standalone: true,
  imports: [],
  templateUrl: './registrar-pago.html',
})
export class RegistrarPagoComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Registrar Pago');
    this.shellState.icon.set('bi bi-cash');
  }
}
