import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ConfirmDialogComponent as ConfirmModalComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AulasService } from './aulas.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { PermisosService } from '../../core/services/permisos.service';
import { Aula, AlumnoAula } from '../../core/services/data.service';

@Component({
  selector: 'app-aulas',
  standalone: true,
  imports: [ModalComponent, ConfirmModalComponent, FormsModule],
  templateUrl: './aulas.html',
})
export class AulasComponent {
  private aulasService = inject(AulasService);
  private shellState = inject(ShellStateService);
  private permisos = inject(PermisosService);

  constructor() {
    this.shellState.title.set('Aulas');
    this.shellState.icon.set('bi-door-open');
  }

  selectedCod = 4;
  editarVisible = false;
  confirmarEliminarVisible = false;
  nuevaAulaVisible = false;
  editarError = '';
  nuevaAulaError = '';
  confirmarAccion = 'eliminar';
  confirmarMessage = '';

  private editarAulaRef?: Aula;
  private eliminarAulaRef?: Aula;

  editarData = { nivel: '', grado: '', seccion: '', max: 35 };
  nuevaAulaData = { nivel: 'Inicial', grado: '', seccion: '', max: 30 };

  get aulas(): Aula[] {
    return this.aulasService.aulas();
  }

  get aulaSeleccionada(): Aula | undefined {
    return this.aulas.find(a => a.cod === this.selectedCod);
  }

  get alumnosAula(): AlumnoAula[] {
    return this.aulasService.alumnosAula4();
  }

  get puedeEditar(): boolean {
    return this.permisos.puede('aulas', 'editar');
  }

  get puedeEliminar(): boolean {
    return this.permisos.puede('aulas', 'eliminar');
  }

  editarAula(event: Event, a: Aula): void {
    event.stopPropagation();
    this.editarAulaRef = a;
    this.editarData = { nivel: a.nivel, grado: a.grado, seccion: a.seccion, max: a.max };
    this.editarError = '';
    this.editarVisible = true;
  }

  cerrarEditar(): void {
    this.editarVisible = false;
    this.editarAulaRef = undefined;
  }

  guardarEdicion(): void {
    const ref = this.editarAulaRef;
    if (!ref) return;
    if (!this.editarData.nivel || !this.editarData.grado.trim() || !this.editarData.seccion.trim()) {
      this.editarError = 'Todos los campos son obligatorios.';
      return;
    }
    this.aulasService.aulas.update(aulas => {
      const idx = aulas.findIndex(a => a.cod === ref.cod);
      if (idx !== -1) {
        aulas = [...aulas];
        aulas[idx] = {
          ...aulas[idx],
          nivel: this.editarData.nivel,
          grado: this.editarData.grado.trim(),
          seccion: this.editarData.seccion.trim().toUpperCase(),
          max: Number(this.editarData.max),
        };
      }
      return aulas;
    });
    this.cerrarEditar();
  }

  eliminarAula(event: Event, a: Aula): void {
    event.stopPropagation();
    this.eliminarAulaRef = a;
    const nuevoEstado = a.estado === 'activo' ? 'eliminado' : 'activo';
    this.confirmarAccion = nuevoEstado === 'eliminado' ? 'eliminar' : 'restaurar';
    this.confirmarMessage = `¿Estás seguro de ${this.confirmarAccion} el aula "${a.nivel} ${a.grado} ${a.seccion}"?`;
    this.confirmarEliminarVisible = true;
  }

  confirmarEliminar(): void {
    const ref = this.eliminarAulaRef;
    if (!ref) return;
    const nuevoEstado = ref.estado === 'activo' ? 'eliminado' : 'activo';
    this.aulasService.aulas.update(aulas => {
      const idx = aulas.findIndex(a => a.cod === ref.cod);
      if (idx !== -1) {
        aulas = [...aulas];
        aulas[idx] = { ...aulas[idx], estado: nuevoEstado };
      }
      return aulas;
    });
    this.confirmarEliminarVisible = false;
    this.eliminarAulaRef = undefined;
  }

  abrirNuevaAula(): void {
    this.nuevaAulaData = { nivel: 'Inicial', grado: '', seccion: '', max: 30 };
    this.nuevaAulaError = '';
    this.nuevaAulaVisible = true;
  }

  guardarNuevaAula(): void {
    if (!this.nuevaAulaData.nivel || !this.nuevaAulaData.grado.trim() || !this.nuevaAulaData.seccion.trim()) {
      this.nuevaAulaError = 'Todos los campos son obligatorios.';
      return;
    }
    const aulas = this.aulasService.aulas();
    const maxCod = aulas.reduce((m, a) => Math.max(m, a.cod), 0);
    const nueva: Aula = {
      cod: maxCod + 1,
      nivel: this.nuevaAulaData.nivel,
      grado: this.nuevaAulaData.grado.trim(),
      seccion: this.nuevaAulaData.seccion.trim().toUpperCase(),
      cupo: 0,
      max: Number(this.nuevaAulaData.max),
      estado: 'activo',
    };
    this.aulasService.aulas.update(as => [...as, nueva]);
    this.nuevaAulaVisible = false;
  }
}
