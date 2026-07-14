import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellStateService } from '../../../core/services/shell-state.service';
import {
  CajaFila,
  ReportesApiService,
} from '../../../core/services/reportes-api.service';

interface Periodo {
  etiqueta: string;
  desde: string; // ISO local: 2026-01-01T00:00:00
  hasta: string;
}

@Component({
  selector: 'app-reporte-caja',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reporte-caja.html',
})
export class ReporteCajaComponent {
  private shellState = inject(ShellStateService);
  private api = inject(ReportesApiService);

  readonly periodos = signal<Periodo[]>([]);
  readonly periodoSel = signal(0); // índice dentro de periodos()
  readonly ingresos = signal<CajaFila[]>([]);
  readonly totalIngresos = signal(0);
  readonly totalEgresos = signal(0);
  readonly saldoNeto = signal(0);
  readonly cargando = signal(false);
  readonly error = signal('');

  constructor() {
    this.shellState.title.set('Reporte de Caja');
    this.shellState.icon.set('bi bi-cash-coin');
    this.iniciar();
  }

  private async iniciar(): Promise<void> {
    try {
      const anios = await this.api.getAnios();
      const listaPeriodos = anios
        .map(a => a.anio)
        .sort((x, y) => y - x)
        .flatMap(anio => this.periodosDelAnio(anio));
      this.periodos.set(listaPeriodos);

      // Por defecto: el período que contiene la fecha actual, si existe.
      const hoy = new Date().toISOString().slice(0, 10);
      const indiceActual = listaPeriodos.findIndex(
        p => p.desde.slice(0, 10) <= hoy && hoy <= p.hasta.slice(0, 10)
      );
      this.periodoSel.set(indiceActual >= 0 ? indiceActual : 0);
      await this.cargar();
    } catch {
      this.error.set('No se pudieron cargar los períodos. Verifica que el backend esté activo.');
    }
  }

  private periodosDelAnio(anio: number): Periodo[] {
    return [
      {
        etiqueta: `Enero - Junio ${anio}`,
        desde: `${anio}-01-01T00:00:00`,
        hasta: `${anio}-06-30T23:59:59`,
      },
      {
        etiqueta: `Julio - Diciembre ${anio}`,
        desde: `${anio}-07-01T00:00:00`,
        hasta: `${anio}-12-31T23:59:59`,
      },
      {
        etiqueta: `Año completo ${anio}`,
        desde: `${anio}-01-01T00:00:00`,
        hasta: `${anio}-12-31T23:59:59`,
      },
    ];
  }

  async cargar(): Promise<void> {
    const periodo = this.periodos()[this.periodoSel()];
    if (!periodo) return;

    this.cargando.set(true);
    this.error.set('');
    try {
      const caja = await this.api.getCaja(periodo.desde, periodo.hasta);
      this.ingresos.set(caja.ingresos);
      this.totalIngresos.set(caja.totalIngresos);
      this.totalEgresos.set(caja.totalEgresos);
      this.saldoNeto.set(caja.saldoNeto);
    } catch {
      this.error.set('No se pudo obtener el reporte de caja.');
      this.ingresos.set([]);
      this.totalIngresos.set(0);
      this.totalEgresos.set(0);
      this.saldoNeto.set(0);
    } finally {
      this.cargando.set(false);
    }
  }

  onPeriodoChange(valor: string): void {
    this.periodoSel.set(+valor);
    this.cargar();
  }

  exportar(): void {
    const etiqueta = this.periodos()[this.periodoSel()]?.etiqueta ?? 'periodo';
    this.api.exportarCsv(
      `reporte-caja-${etiqueta.replaceAll(' ', '-')}.csv`,
      ['Mes', 'Concepto', 'Cant. pagos', 'Total'],
      [
        ...this.ingresos().map(f => [f.nombreMes, f.concepto, f.cantidadPagos, f.total] as (string | number)[]),
        [],
        ['Total ingresos', '', '', this.totalIngresos()],
        ['Total egresos', '', '', this.totalEgresos()],
        ['Saldo neto', '', '', this.saldoNeto()],
      ]
    );
  }
}