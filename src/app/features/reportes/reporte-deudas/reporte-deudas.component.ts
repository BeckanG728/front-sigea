import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellStateService } from '../../../core/services/shell-state.service';
import {
  AnioAcademico,
  DeudaDetalle,
  ReportesApiService,
} from '../../../core/services/reportes-api.service';

interface FilaDeuda extends DeudaDetalle {
  vencimientoTexto: string;   // dd/MM/yyyy
  estadoTexto: string;        // Pendiente | Bloqueado
  claseBadge: string;
}

@Component({
  selector: 'app-reporte-deudas',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reporte-deudas.html',
})
export class ReporteDeudasComponent {
  private shellState = inject(ShellStateService);
  private api = inject(ReportesApiService);

  readonly anios = signal<AnioAcademico[]>([]);
  readonly anioSel = signal<number | null>(null);      // número de año (2026)
  readonly estadoSel = signal<string>('');             // '' = todos
  readonly filas = signal<FilaDeuda[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly totalDeuda = computed(
    () => this.filas().reduce((suma, f) => suma + f.monto, 0)
  );
  readonly alumnosMorosos = computed(
    () => new Set(this.filas().map(f => f.documento)).size
  );

  constructor() {
    this.shellState.title.set('Reporte de Deudas');
    this.shellState.icon.set('bi bi-cash-stack');
    this.iniciar();
  }

  private async iniciar(): Promise<void> {
    try {
      const anios = await this.api.getAnios();
      this.anios.set(anios);
      const activo = anios.find(a => a.estado) ?? anios.at(-1) ?? null;
      this.anioSel.set(activo?.anio ?? null);
      await this.cargar();
    } catch {
      this.error.set('No se pudieron cargar los años académicos. Verifica que el backend esté activo.');
    }
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const deudas = await this.api.getDeudasDetalle(this.anioSel(), this.estadoSel() || null);
      this.filas.set(deudas.map(d => this.decorar(d)));
    } catch {
      this.error.set('No se pudo obtener el reporte de deudas.');
      this.filas.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  private decorar(d: DeudaDetalle): FilaDeuda {
    const [anio, mes, dia] = d.fechaVencimiento.split('-');
    const esPendiente = d.estado === 'PENDIENTE';
    return {
      ...d,
      vencimientoTexto: `${dia}/${mes}/${anio}`,
      estadoTexto: esPendiente ? 'Pendiente' : 'Bloqueado',
      claseBadge: esPendiente ? 'badge--danger' : 'badge--neutral',
    };
  }

  onAnioChange(valor: string): void {
    this.anioSel.set(valor ? +valor : null);
    this.cargar();
  }

  onEstadoChange(valor: string): void {
    this.estadoSel.set(valor);
    this.cargar();
  }

  exportar(): void {
    this.api.exportarCsv(
      `reporte-deudas-${this.anioSel() ?? 'todos'}.csv`,
      ['Alumno', 'Documento', 'Concepto', 'Monto', 'Vencimiento', 'Días de atraso', 'Estado'],
      this.filas().map(f => [
        f.alumno, f.documento, f.concepto, f.monto, f.vencimientoTexto, f.diasAtraso, f.estadoTexto,
      ])
    );
  }
}