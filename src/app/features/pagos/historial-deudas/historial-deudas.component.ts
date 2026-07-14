import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PagosService, DeudaHistorialView } from '../pagos.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-historial-deudas',
  standalone: true,
  imports: [],
  templateUrl: './historial-deudas.html',
})
export class HistorialDeudasComponent implements OnInit {
  private pagosService = inject(PagosService);
  private shellState = inject(ShellStateService);
  private router = inject(Router);

  constructor() {
    this.shellState.title.set('Historial de Deudas');
    this.shellState.icon.set('bi bi-clock-history');
  }

  readonly page = signal(1);
  readonly pages = signal<(number | string)[]>([]);

  deudas = this.pagosService.deudasHistorial;
  loading = this.pagosService.historialLoading;
  totalPages = this.pagosService.historialTotalPages;
  totalElements = this.pagosService.historialTotalElements;
  cantidadAlumnosDeudores = this.pagosService.cantidadAlumnosDeudores;
  totalDeudaGeneral = this.pagosService.totalDeudaGeneral;

  ngOnInit(): void {
    this.cargarPagina(0);
  }

  async cargarPagina(page: number): Promise<void> {
    await this.pagosService.listarHistorialGeneral(page);
    this.actualizarPaginas();
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.cargarPagina(p - 1);
    }
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

  irAPagar(d: DeudaHistorialView): void {
    this.router.navigate(['/pagos/registrar'], {
      queryParams: { documento: d.numeroDocumento }
    });
  }
}
