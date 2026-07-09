import { Component, inject } from '@angular/core';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MatriculaService } from './matricula.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { Aula, Cuota } from '../../core/services/data.service';

@Component({
  selector: 'app-matricula',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './matricula.html',
})
export class MatriculaComponent {
  private matriculaService = inject(MatriculaService);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Matrícula');
    this.shellState.icon.set('bi-pencil-square');
  }

  readonly buscables = [
    { paterno: 'Chinga', materno: 'Ramos', nombre: 'Carlos' },
    { paterno: 'Chinga', materno: 'López', nombre: 'Ana' },
  ];

  alumnoSeleccionado = 'Chinga Ramos, Carlos';
  aulaSeleccionadaCod = 4;
  mostrarExito = false;
  buscarAlumnoVisible = false;
  buscarAulaVisible = false;

  get aulaActual(): Aula | undefined {
    return this.matriculaService.aulas().find(a => a.cod === this.aulaSeleccionadaCod);
  }

  get aulasActivas(): Aula[] {
    return this.matriculaService.aulas().filter(a => a.estado === 'activo');
  }

  get cuotas(): Cuota[] {
    return this.matriculaService.cuotasCarlosChinga2026();
  }

  abrirBuscarAlumno(): void {
    this.buscarAlumnoVisible = true;
  }

  seleccionarAlumno(idx: number): void {
    const a = this.buscables[idx];
    this.alumnoSeleccionado = `${a.paterno} ${a.materno}, ${a.nombre}`;
    this.buscarAlumnoVisible = false;
  }

  abrirBuscarAula(): void {
    this.buscarAulaVisible = true;
  }

  seleccionarAula(cod: number): void {
    this.aulaSeleccionadaCod = cod;
    this.buscarAulaVisible = false;
  }

  matricular(): void {
    const aula = this.aulaActual;
    if (!aula || aula.cupo >= aula.max) return;

    this.matriculaService.aulas.update(aulas => {
      const idx = aulas.findIndex(a => a.cod === this.aulaSeleccionadaCod);
      if (idx !== -1) {
        aulas = [...aulas];
        aulas[idx] = { ...aulas[idx], cupo: aulas[idx].cupo + 1 };
      }
      return aulas;
    });

    this.mostrarExito = true;
    setTimeout(() => { this.mostrarExito = false; }, 1800);
  }
}
