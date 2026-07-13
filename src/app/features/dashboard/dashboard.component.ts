import { Component, computed, inject } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from '../../core/services/shell-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor(private data: DataService) {
    this.shellState.title.set('Dashboard');
    this.shellState.icon.set('bi bi-speedometer2');
  }

  protected get matriculas() { return this.data.matriculasRecientes2026; }

  protected readonly kpiMatriculas = computed(() => this.matriculas().length);
  protected readonly kpiAulas = computed(() => this.data.aulas().filter(a => a.estado === 'activo').length);
  protected readonly kpiPagosPendientes = computed(() =>
    this.data.cuotasCarlosChinga2026().filter(c => c.estado === 'pagar' || c.estado === 'pendiente').length
  );

  pad(n: number): string {
    return String(n).padStart(3, '0');
  }

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
