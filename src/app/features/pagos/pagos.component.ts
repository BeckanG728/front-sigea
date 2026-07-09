import { Component, inject } from '@angular/core';
import { PagosService } from './pagos.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { Cuota, DeudaAnterior } from '../../core/services/data.service';

type Vista = 'actual' | '2025';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [],
  templateUrl: './pagos.html',
})
export class PagosComponent {
  private pagosService = inject(PagosService);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Pagos');
    this.shellState.icon.set('bi-credit-card-2-front');
  }

  vista: Vista = 'actual';

  get cuotas(): Cuota[] {
    return this.pagosService.cuotasCarlosChinga2026();
  }

  get deuda2025(): DeudaAnterior[] {
    return this.pagosService.deuda2025CarlosChinga();
  }

  get totalPagado(): number {
    return this.deuda2025.filter(d => d.estado === 'pagado').reduce((s, d) => s + d.monto, 0);
  }

  get deudaPendiente(): number {
    return this.deuda2025.filter(d => d.estado === 'pendiente').reduce((s, d) => s + d.monto, 0);
  }

  pagarCuota(event: Event): void {
    const btn = event.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Procesando…';
  }

  pagarAhora(event: Event): void {
    this.pagarCuota(event);
  }
}
