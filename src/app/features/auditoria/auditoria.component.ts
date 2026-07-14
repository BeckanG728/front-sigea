import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { AuditoriaApiService, FiltrosAuditoria } from '../../core/services/auditoria-api.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auditoria.html',
})
export class AuditoriaComponent implements OnInit {
  readonly page = signal(1);
  readonly filtros = signal<FiltrosAuditoria>({
    modulo: '', operacion: '', desde: '', hasta: '',
  });

  private auditoriaApi = inject(AuditoriaApiService);

  constructor(
    private auth: AuthService,
    private shellState: ShellStateService,
  ) {
    this.shellState.title.set('Auditoría');
    this.shellState.icon.set('bi bi-clock-history');
  }

  ngOnInit(): void {
    this.buscar();
  }

  get eventos() {
    return this.auditoriaApi.items;
  }

  get totalPages() {
    return this.auditoriaApi.totalPages;
  }

  get currentPage() {
    return this.auditoriaApi.currentPage;
  }

  readonly modulosDisponibles = [
    'aula', 'alumno', 'nivel', 'grado', 'anio_academico',
    'tipo_documento', 'matricula', 'concepto', 'tipo_concepto',
    'auth', 'usuario', 'parametro',
  ];

  readonly operacionesDisponibles = [
    'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PAGO', 'MATRICULA',
  ];

  readonly pages = signal<(number | string)[]>([]);

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

  async buscar(): Promise<void> {
    await this.auditoriaApi.cargar(this.page() - 1, this.filtros());
    this.actualizarPaginas();
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.buscar();
    }
  }

  onFilterChange(): void {
    this.page.set(1);
    this.buscar();
  }
}