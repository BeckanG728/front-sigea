import { Component, computed, signal, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-director-pagos',
  standalone: true,
  imports: [],
  templateUrl: './director-pagos.html',
})
export class DirectorPagosComponent {
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor(private data: DataService) {
    this.shellState.title.set('Pagos');
    this.shellState.icon.set('bi bi-credit-card-2-front');
  }

  protected readonly vista = signal<'actual' | '2025'>('actual');

  protected get cuotas() { return this.data.cuotasCarlosChinga2026; }
  protected get deuda() { return this.data.deuda2025CarlosChinga; }

  protected readonly totalPagado = computed(() =>
    this.deuda().filter(d => d.estado === 'pagado').reduce((s, d) => s + d.monto, 0)
  );

  protected readonly deudaPendiente = computed(() =>
    this.deuda().filter(d => d.estado === 'pendiente').reduce((s, d) => s + d.monto, 0)
  );

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
