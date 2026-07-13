import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ConfirmDialogComponent as ConfirmModalComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AulaApiService, AulaListado } from '../../core/services/aula-api.service';
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

  readonly nuevoNivel = signal(0);
  readonly nuevoGrado = signal(0);
  readonly nuevaSeccion = signal('');
  readonly nuevaCapacidad = signal(30);

  readonly editarNivel = signal(0);
  readonly editarGrado = signal(0);
  readonly editarSeccion = signal('');
  readonly editarCapacidad = signal(35);

  readonly gradosFiltrados = computed(() =>
    this.grados().filter(g => g.codNivel === this.nuevoNivel())
  );

  readonly gradosFiltradosEditar = computed(() =>
    this.grados().filter(g => g.codNivel === this.editarNivel())
  );

  constructor() {
    this.shellState.title.set('Aulas');
    this.shellState.icon.set('bi-door-open');
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.aulaApi.cargarAnioActivo();
    } catch {
      // ignorar si no hay año activo
    }
    await this.aulaApi.cargarNiveles();
    await this.aulaApi.cargarGrados();
    await this.aulaApi.cargarAulas(this.anioActivo()?.id);
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

  async seleccionarAula(id: number): Promise<void> {
    this.selectedId.set(id);
    await this.aulaApi.cargarAlumnosAula(id);
  }

  onNivelChange(codNivel: number): void {
    this.nuevoNivel.set(codNivel);
    this.nuevoGrado.set(0);
  }

  onNivelChangeEditar(codNivel: number): void {
    this.editarNivel.set(codNivel);
    this.editarGrado.set(0);
  }

  editarAula(event: Event, a: AulaListado): void {
    event.stopPropagation();
    this.editarAulaRef = a;
    const nivelId = this.niveles().find(n => n.nombre === a.nivel)?.id ?? 0;
    const gradoId = this.grados().find(g => g.nombreGrado === a.grado && g.codNivel === nivelId)?.id ?? 0;
    this.editarNivel.set(nivelId);
    this.editarGrado.set(gradoId);
    this.editarSeccion.set(a.seccion);
    this.editarCapacidad.set(a.capacidadMaxima);
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
    if (!this.editarNivel() || !this.editarGrado() || !this.editarSeccion().trim()) {
      this.editarError = 'Todos los campos son obligatorios.';
      return;
    }
    this.loading.set(true);
    try {
      await this.aulaApi.editarAula(ref.id, {
        codAnioAcademico: this.anioActivo()?.id ?? 0,
        codNivel: this.editarNivel(),
        codGrado: this.editarGrado(),
        seccion: this.editarSeccion().trim().toUpperCase(),
        capacidadMaxima: Number(this.editarCapacidad()),
      });
      await this.aulaApi.cargarAulas(this.anioActivo()?.id);
      this.cerrarEditar();
    } catch (e: any) {
      this.editarError = e.error?.message || 'Error al guardar';
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
      await this.aulaApi.cargarAulas(this.anioActivo()?.id);
    } catch {
      // ignorar
    } finally {
      this.loading.set(false);
      this.confirmarEliminarVisible = false;
    }
  }

  abrirNuevaAula(): void {
    const primerNivel = this.niveles()[0];
    this.nuevoNivel.set(primerNivel?.id ?? 0);
    this.nuevoGrado.set(0);
    this.nuevaSeccion.set('');
    this.nuevaCapacidad.set(30);
    this.nuevaAulaError = '';
    this.nuevaAulaVisible = true;
  }

  async guardarNuevaAula(): Promise<void> {
    if (!this.nuevoNivel() || !this.nuevoGrado() || !this.nuevaSeccion().trim()) {
      this.nuevaAulaError = 'Todos los campos son obligatorios.';
      return;
    }
    this.loading.set(true);
    try {
      await this.aulaApi.crearAula({
        codAnioAcademico: this.anioActivo()?.id ?? 0,
        codNivel: this.nuevoNivel(),
        codGrado: this.nuevoGrado(),
        seccion: this.nuevaSeccion().trim().toUpperCase(),
        capacidadMaxima: Number(this.nuevaCapacidad()),
      });
      await this.aulaApi.cargarAulas(this.anioActivo()?.id);
      this.nuevaAulaVisible = false;
    } catch (e: any) {
      this.nuevaAulaError = e.error?.message || 'Error al crear aula';
    } finally {
      this.loading.set(false);
    }
  }

  onNivelChangeNative(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.nuevoNivel.set(Number(target.value));
    this.nuevoGrado.set(0);
  }

  onNivelChangeNativeEditar(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.editarNivel.set(Number(target.value));
    this.editarGrado.set(0);
  }
}
