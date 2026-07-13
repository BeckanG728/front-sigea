import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ConfirmDialogComponent as ConfirmModalComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AulaApiService, AulaListado, AlumnoAula, Nivel, Grado, AulaRequest } from '../../core/services/aula-api.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { PermisosService } from '../../core/services/permisos.service';

@Component({
  selector: 'app-aulas',
  standalone: true,
  imports: [ModalComponent, ConfirmModalComponent, FormsModule],
  templateUrl: './aulas.html',
})
export class AulasComponent implements OnInit {
  private aulaApi = inject(AulaApiService);
  private shellState = inject(ShellStateService);
  private permisos = inject(PermisosService);

  readonly aulas = this.aulaApi.aulas;
  readonly alumnosAula = this.aulaApi.alumnosAula;
  readonly niveles = this.aulaApi.niveles;
  readonly grados = this.aulaApi.grados;
  readonly anioActivo = this.aulaApi.anioActivo;
  readonly loading = this.aulaApi.loading;

  selectedId = signal<number | null>(null);
  editarVisible = false;
  confirmarEliminarVisible = false;
  nuevaAulaVisible = false;
  editarError = '';
  nuevaAulaError = '';
  confirmarMessage = '';
  private editarAulaRef?: AulaListado;
  private eliminarAulaRef?: AulaListado;

  editarData = { codNivel: 0, codGrado: 0, seccion: '', capacidadMaxima: 35 };
  nuevaAulaData = { codNivel: 0, codGrado: 0, seccion: '', capacidadMaxima: 30 };

  constructor() {
    this.shellState.title.set('Aulas');
    this.shellState.icon.set('bi-door-open');
  }

  async ngOnInit(): Promise<void> {
    await this.aulaApi.cargarAnioActivo();
    await this.aulaApi.cargarNiveles();
    await this.aulaApi.cargarGrados();
    await this.aulaApi.cargarAulas(this.anioActivo()?.anio);
  }

  get aulaSeleccionada(): AulaListado | undefined {
    return this.aulas().find(a => a.id === this.selectedId());
  }

  get puedeEditar(): boolean {
    return this.permisos.puede('aulas', 'editar');
  }

  get puedeEliminar(): boolean {
    return this.permisos.puede('aulas', 'eliminar');
  }

  readonly gradosFiltrados = computed(() =>
    this.grados().filter(g => g.codNivel === this.nuevaAulaData.codNivel)
  );

  readonly gradosFiltradosEditar = computed(() =>
    this.grados().filter(g => g.codNivel === this.editarData.codNivel)
  );

  async seleccionarAula(id: number): Promise<void> {
    this.selectedId.set(id);
    await this.aulaApi.cargarAlumnosAula(id);
  }

  editarAula(event: Event, a: AulaListado): void {
    event.stopPropagation();
    this.editarAulaRef = a;
    this.editarData = {
      codNivel: this.niveles().find(n => n.nombre === a.nivel)?.id ?? 0,
      codGrado: this.grados().find(g => g.nombreGrado === a.grado)?.id ?? 0,
      seccion: a.seccion,
      capacidadMaxima: a.capacidadMaxima,
    };
    this.editarError = '';
    this.editarVisible = true;
  }

  cerrarEditar(): void {
    this.editarVisible = false;
    this.editarAulaRef = undefined;
  }

  async guardarEdicion(): Promise<void> {
    const ref = this.editarAulaRef;
    if (!ref) return;
    if (!this.editarData.codNivel || !this.editarData.codGrado || !this.editarData.seccion.trim()) {
      this.editarError = 'Todos los campos son obligatorios.';
      return;
    }
    this.loading.set(true);
    try {
      await this.aulaApi.editarAula(ref.id, {
        codAnioAcademico: this.anioActivo()?.id ?? 0,
        codNivel: this.editarData.codNivel,
        codGrado: this.editarData.codGrado,
        seccion: this.editarData.seccion.trim().toUpperCase(),
        capacidadMaxima: Number(this.editarData.capacidadMaxima),
      });
      await this.aulaApi.cargarAulas(this.anioActivo()?.anio);
      this.cerrarEditar();
    } catch (e: any) {
      this.editarError = e.error?.mensaje || 'Error al guardar';
    } finally {
      this.loading.set(false);
    }
  }

  eliminarAula(event: Event, a: AulaListado): void {
    event.stopPropagation();
    this.eliminarAulaRef = a;
    const textoEstado = a.estado ? 'eliminar' : 'restaurar';
    this.confirmarMessage = `¿Estás seguro de ${textoEstado} el aula "${a.nivel} ${a.grado} ${a.seccion}"?`;
    this.confirmarEliminarVisible = true;
  }

  async confirmarEliminar(): Promise<void> {
    const ref = this.eliminarAulaRef;
    if (!ref) return;
    this.loading.set(true);
    try {
      await this.aulaApi.eliminarAula(ref.id);
      await this.aulaApi.cargarAulas(this.anioActivo()?.anio);
    } catch {
      // ignorar
    } finally {
      this.loading.set(false);
      this.confirmarEliminarVisible = false;
    }
  }

  abrirNuevaAula(): void {
    const primerNivel = this.niveles()[0];
    this.nuevaAulaData = {
      codNivel: primerNivel?.id ?? 0,
      codGrado: 0,
      seccion: '',
      capacidadMaxima: 30,
    };
    this.nuevaAulaError = '';
    this.nuevaAulaVisible = true;
  }

  async guardarNuevaAula(): Promise<void> {
    if (!this.nuevaAulaData.codNivel || !this.nuevaAulaData.codGrado || !this.nuevaAulaData.seccion.trim()) {
      this.nuevaAulaError = 'Todos los campos son obligatorios.';
      return;
    }
    this.loading.set(true);
    try {
      await this.aulaApi.crearAula({
        codAnioAcademico: this.anioActivo()?.id ?? 0,
        codNivel: this.nuevaAulaData.codNivel,
        codGrado: this.nuevaAulaData.codGrado,
        seccion: this.nuevaAulaData.seccion.trim().toUpperCase(),
        capacidadMaxima: Number(this.nuevaAulaData.capacidadMaxima),
      });
      await this.aulaApi.cargarAulas(this.anioActivo()?.anio);
      this.nuevaAulaVisible = false;
    } catch (e: any) {
      this.nuevaAulaError = e.error?.mensaje || 'Error al crear aula';
    } finally {
      this.loading.set(false);
    }
  }
}
