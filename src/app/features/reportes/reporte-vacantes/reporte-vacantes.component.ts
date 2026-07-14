import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellStateService } from '../../../core/services/shell-state.service';
import {
  AnioAcademico,
  ReportesApiService,
} from '../../../core/services/reportes-api.service';

interface FilaVacante {
  aula: number;
  nivel: string;
  grado: string;
  seccion: string;
  ocupados: number;
  cupo: number;
  vacantes: number;
  estado: 'Disponible' | 'Casi llena' | 'Llena';
  claseBadge: string;
  claseVacantes: string;
}

/** Umbral de ocupación a partir del cual el aula se marca "Casi llena". */
const UMBRAL_CASI_LLENA = 85;

@Component({
  selector: 'app-reporte-vacantes',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reporte-vacantes.html',
})
export class ReporteVacantesComponent {
  private shellState = inject(ShellStateService);
  private api = inject(ReportesApiService);

  readonly anios = signal<AnioAcademico[]>([]);
  readonly anioSel = signal<number | null>(null); // id del año académico
  readonly filas = signal<FilaVacante[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly anioLabel = computed(
    () => this.anios().find(a => a.id === this.anioSel())?.anio ?? ''
  );
  readonly totalVacantes = computed(
    () => this.filas().reduce((suma, f) => suma + f.vacantes, 0)
  );

  constructor() {
    this.shellState.title.set('Reporte de Vacantes');
    this.shellState.icon.set('bi bi-door-open');
    this.iniciar();
  }

  private async iniciar(): Promise<void> {
    try {
      const anios = await this.api.getAnios();
      this.anios.set(anios);
      const activo = anios.find(a => a.estado) ?? anios.at(-1) ?? null;
      this.anioSel.set(activo?.id ?? null);
      await this.cargar();
    } catch {
      this.error.set('No se pudieron cargar los años académicos. Verifica que el backend esté activo.');
    }
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const vacantes = await this.api.getVacantes(this.anioSel());
      this.filas.set(
        vacantes.map(v => {
          const ocupacion = v.capacidadMaxima > 0
            ? (v.matriculados / v.capacidadMaxima) * 100
            : 0;
          const estado = this.estadoAula(v.vacantesDisponibles, ocupacion);
          return {
            aula: v.codAula,
            nivel: v.nivel,
            grado: v.grado,
            seccion: v.seccion,
            ocupados: v.matriculados,
            cupo: v.capacidadMaxima,
            vacantes: v.vacantesDisponibles,
            ...estado,
          };
        })
      );
    } catch {
      this.error.set('No se pudo obtener el reporte de vacantes.');
      this.filas.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  private estadoAula(vacantes: number, ocupacion: number): Pick<FilaVacante, 'estado' | 'claseBadge' | 'claseVacantes'> {
    if (vacantes <= 0) {
      return { estado: 'Llena', claseBadge: 'badge--danger', claseVacantes: 'var(--color-danger)' };
    }
    if (ocupacion >= UMBRAL_CASI_LLENA) {
      return { estado: 'Casi llena', claseBadge: 'badge--warning', claseVacantes: 'var(--color-warning)' };
    }
    return { estado: 'Disponible', claseBadge: 'badge--success', claseVacantes: 'var(--color-success)' };
  }

  onAnioChange(valor: string): void {
    this.anioSel.set(valor ? +valor : null);
    this.cargar();
  }

  exportar(): void {
    this.api.exportarCsv(
      `reporte-vacantes-${this.anioLabel()}.csv`,
      ['Aula', 'Nivel', 'Grado', 'Sección', 'Ocupados', 'Cupo', 'Vacantes', 'Estado'],
      this.filas().map(f => [
        f.aula, f.nivel, f.grado, f.seccion, f.ocupados, f.cupo, f.vacantes, f.estado,
      ])
    );
  }
}