import { Component, computed, inject, signal } from '@angular/core';
import { ShellStateService } from '../../core/services/shell-state.service';
import { DashboardApiService, MatriculaDashboardRow } from '../../core/services/dashboard-api.service';
import { ReportesApiService } from '../../core/services/reportes-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private dashboardApi = inject(DashboardApiService);
  private reportesApi = inject(ReportesApiService);
  private shellState = inject(ShellStateService);

  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly pages = signal<(number | string)[]>([]);

  readonly resumen = signal<{
    totalMatriculas: number;
    totalAulasActivas: number;
    pagosPendientes: number;
  } | null>(null);

  readonly matriculas = signal<MatriculaDashboardRow[]>([]);

  constructor() {
    this.shellState.title.set('Dashboard');
    this.shellState.icon.set('bi bi-speedometer2');
    this.cargar();
  }

  async cargar(): Promise<void> {
    const res = await this.dashboardApi.cargarResumen(this.page() - 1);
    this.resumen.set({
      totalMatriculas: res.totalMatriculas,
      totalAulasActivas: res.totalAulasActivas,
      pagosPendientes: res.pagosPendientes,
    });
    this.matriculas.set(res.matriculasRecientes.content);
    this.totalPages.set(res.matriculasRecientes.totalPages);
    this.actualizarPaginas();
  }

  private actualizarPaginas(): void {
    const total = this.totalPages();
    const cur = this.page();
    const range: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (cur > 3) range.push('...');
      const lo = Math.max(2, cur - 1);
      const hi = Math.min(total - 1, cur + 1);
      for (let i = lo; i <= hi; i++) range.push(i);
      if (cur < total - 2) range.push('...');
      range.push(total);
    }
    this.pages.set(range);
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.cargar();
    }
  }

  pad(n: number): string {
    return String(n).padStart(3, '0');
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO: 'badge badge--success',
      activo: 'badge badge--success',
      PENDIENTE: 'badge badge--warning',
      pendiente: 'badge badge--warning',
      PAGADA: 'badge badge--success',
      pagado: 'badge badge--success',
      BLOQUEADA: 'badge badge--neutral',
      bloqueado: 'badge badge--neutral',
      INACTIVO: 'badge badge--danger',
      inactivo: 'badge badge--danger',
    };
    return map[estado] || 'badge badge--neutral';
  }

  async exportar(): Promise<void> {
    const cabeceras = ['N°', 'Alumno', 'Aula', 'Fecha', 'Estado', 'Registrado por'];
    const filas = (await this.dashboardApi.exportarMatriculas())
      .map(r => [r.n, r.alumno, r.aula, r.fecha, r.estado, r.registradoPor]);
    this.reportesApi.exportarCsv('matriculas-dashboard.csv', cabeceras, filas);
  }
}
