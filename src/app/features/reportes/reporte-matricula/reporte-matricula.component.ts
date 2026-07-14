import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellStateService } from '../../../core/services/shell-state.service';
import {
  AnioAcademico,
  Nivel,
  ReportesApiService,
} from '../../../core/services/reportes-api.service';

interface FilaMatricula {
  aula: string;       // sección (A, B, ...)
  nivel: string;
  grado: string;
  matriculados: number;
  cupoMaximo: number;
  ocupacion: number;  // porcentaje 0..100
}

@Component({
  selector: 'app-reporte-matricula',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reporte-matricula.html',
})
export class ReporteMatriculaComponent {
  private shellState = inject(ShellStateService);
  private api = inject(ReportesApiService);

  readonly anios = signal<AnioAcademico[]>([]);
  readonly niveles = signal<Nivel[]>([]);
  readonly anioSel = signal<number | null>(null);   // id del año académico
  readonly nivelSel = signal<number | null>(null);  // id del nivel (null = todos)
  readonly filas = signal<FilaMatricula[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly anioLabel = computed(
    () => this.anios().find(a => a.id === this.anioSel())?.anio ?? ''
  );
  readonly totalMatriculados = computed(
    () => this.filas().reduce((suma, f) => suma + f.matriculados, 0)
  );

  constructor() {
    this.shellState.title.set('Reporte de Matrícula');
    this.shellState.icon.set('bi bi-file-text');
    this.iniciar();
  }

  private async iniciar(): Promise<void> {
    try {
      const [anios, niveles] = await Promise.all([
        this.api.getAnios(),
        this.api.getNiveles(),
      ]);
      this.anios.set(anios);
      this.niveles.set(niveles);

      const activo = anios.find(a => a.estado) ?? anios.at(-1) ?? null;
      this.anioSel.set(activo?.id ?? null);
      await this.cargar();
    } catch {
      this.error.set('No se pudieron cargar los catálogos. Verifica que el backend esté activo.');
    }
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const vacantes = await this.api.getVacantes(this.anioSel(), this.nivelSel());
      this.filas.set(
        vacantes.map(v => ({
          aula: v.seccion,
          nivel: v.nivel,
          grado: v.grado,
          matriculados: v.matriculados,
          cupoMaximo: v.capacidadMaxima,
          ocupacion: v.capacidadMaxima > 0
            ? Math.round((v.matriculados / v.capacidadMaxima) * 100)
            : 0,
        }))
      );
    } catch {
      this.error.set('No se pudo obtener el reporte de matrículas.');
      this.filas.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  onAnioChange(valor: string): void {
    this.anioSel.set(valor ? +valor : null);
    this.cargar();
  }

  onNivelChange(valor: string): void {
    this.nivelSel.set(valor ? +valor : null);
    this.cargar();
  }

  exportar(): void {
    this.api.exportarCsv(
      `reporte-matricula-${this.anioLabel()}.csv`,
      ['#', 'Aula', 'Nivel', 'Grado', 'Matriculados', 'Cupo máx.', '% Ocupación'],
      this.filas().map((f, i) => [
        i + 1, f.aula, f.nivel, f.grado, f.matriculados, f.cupoMaximo, `${f.ocupacion}%`,
      ])
    );
  }
}