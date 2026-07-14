import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ConfirmDialogComponent as ConfirmModalComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ConceptosService, Concepto } from './conceptos.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { PermisosService } from '../../core/services/permisos.service';

@Component({
  selector: 'app-conceptos',
  standalone: true,
  imports: [ModalComponent, ConfirmModalComponent, FormsModule],
  templateUrl: './conceptos.html',
})
export class ConceptosComponent implements OnInit {
  private conceptosService = inject(ConceptosService);
  private shellState = inject(ShellStateService);
  private permisos = inject(PermisosService);

  anioAcademicoId = 0;
  anioActual = 2026;
  loading = false;
  error = '';
  readonly page = signal(1);
  readonly pages = signal<(number | string)[]>([]);

  constructor() {
    this.shellState.title.set('Conceptos');
    this.shellState.icon.set('bi-receipt');
  }

  async ngOnInit(): Promise<void> {
    try {
      const anio = await this.conceptosService.cargarAnioActivo();
      this.anioAcademicoId = anio.id;
      this.anioActual = anio.anio;
    } catch {
      this.anioAcademicoId = 0;
    }
    await Promise.all([
      this.conceptosService.cargarTiposConcepto(),
      this.refresh(),
    ]);
  }

  editarVisible = false;
  editarTitulo = 'Editar concepto';
  editarError = '';
  confirmarEliminarVisible = false;
  confirmarMessage = '';
  confirmarAccion = 'eliminar';

  private editarRef?: Concepto;
  private eliminarRef?: Concepto;
  private esNuevo = false;

  formData = {
    nombreConcepto: '',
    codTipoConcepto: 0,
    tipo: 'FIJO',
    monto: 0,
    obligatorio: true,
  };

  get conceptos(): Concepto[] {
    return this.conceptosService.conceptos();
  }

  get tiposConcepto() {
    return this.conceptosService.tiposConcepto();
  }

  get totalPages() {
    return this.conceptosService.totalPages;
  }

  get currentPage() {
    return this.conceptosService.currentPage;
  }

  get puedeEditar(): boolean {
    return this.permisos.puede('conceptos', 'editar');
  }

  get puedeEliminar(): boolean {
    return this.permisos.puede('conceptos', 'eliminar');
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

  async refresh(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.conceptosService.listar(this.anioAcademicoId || undefined, this.page() - 1);
      this.actualizarPaginas();
    } catch (e) {
      this.error = 'Error al cargar conceptos';
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.refresh();
    }
  }

  editarConcepto(c: Concepto): void {
    this.editarRef = c;
    this.esNuevo = false;
    this.editarTitulo = 'Editar concepto';
    this.formData = {
      nombreConcepto: c.nombre,
      codTipoConcepto: this.tiposConcepto.find(t => t.nombre === c.tipoConceptoNombre)?.id ?? 0,
      tipo: c.tipo,
      monto: c.monto,
      obligatorio: c.obligatorio,
    };
    this.editarError = '';
    this.editarVisible = true;
  }

  nuevoConcepto(): void {
    this.editarRef = undefined;
    this.esNuevo = true;
    this.editarTitulo = 'Nuevo concepto';
    const primerTipo = this.tiposConcepto[0];
    this.formData = {
      nombreConcepto: '',
      codTipoConcepto: primerTipo?.id ?? 0,
      tipo: 'FIJO',
      monto: 0,
      obligatorio: true,
    };
    this.editarError = '';
    this.editarVisible = true;
  }

  cerrarEditar(): void {
    this.editarVisible = false;
    this.editarRef = undefined;
  }

  async guardarConcepto(): Promise<void> {
    if (!this.formData.nombreConcepto.trim()) {
      this.editarError = 'El nombre del concepto es obligatorio.';
      return;
    }
    if (!this.formData.codTipoConcepto) {
      this.editarError = 'Selecciona un tipo de concepto.';
      return;
    }

    if (!this.anioAcademicoId) {
      this.editarError = 'No hay año académico activo.';
      return;
    }

    this.loading = true;
    this.editarError = '';
    try {
      if (this.esNuevo) {
        await this.conceptosService.crear({
          codAnioAcademico: this.anioAcademicoId,
          codTipoConcepto: this.formData.codTipoConcepto,
          nombreConcepto: this.formData.nombreConcepto.trim(),
          monto: Number(this.formData.monto),
          ordenPago: this.conceptosService.totalElements() + 1,
          obligatorio: this.formData.obligatorio,
          tipo: this.formData.tipo,
        });
      } else {
        const ref = this.editarRef;
        if (!ref) return;
        await this.conceptosService.actualizar(ref.id, {
          codAnioAcademico: this.anioAcademicoId,
          codTipoConcepto: this.formData.codTipoConcepto,
          nombreConcepto: this.formData.nombreConcepto.trim(),
          monto: Number(this.formData.monto),
          ordenPago: ref.orden,
          obligatorio: this.formData.obligatorio,
          tipo: this.formData.tipo,
          version: ref.version,
        });
      }

      this.page.set(1);
      await this.refresh();
      this.cerrarEditar();
    } catch (e: any) {
      this.editarError = e.error?.message || 'Error al guardar el concepto.';
    } finally {
      this.loading = false;
    }
  }

  eliminarConcepto(c: Concepto): void {
    this.eliminarRef = c;
    const accion = c.activo ? 'eliminar' : 'restaurar';
    this.confirmarAccion = accion;
    this.confirmarMessage = `¿Estás seguro de ${accion} el concepto "${c.nombre}"?`;
    this.confirmarEliminarVisible = true;
  }

  async confirmarEliminar(): Promise<void> {
    const ref = this.eliminarRef;
    if (!ref) return;

    this.loading = true;
    try {
      if (ref.activo) {
        await this.conceptosService.eliminar(ref.id);
      }
      await this.refresh();
    } catch (e) {
      this.error = 'Error al eliminar el concepto.';
    } finally {
      this.loading = false;
      this.confirmarEliminarVisible = false;
      this.eliminarRef = undefined;
    }
  }

  clonar(): void {
    // Disabled functionality
  }
}