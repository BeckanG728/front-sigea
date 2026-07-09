import { Component, inject } from '@angular/core';
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
export class ConceptosComponent {
  private conceptosService = inject(ConceptosService);
  private shellState = inject(ShellStateService);
  private permisos = inject(PermisosService);

  constructor() {
    this.shellState.title.set('Conceptos');
    this.shellState.icon.set('bi-receipt');
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

  formData = { nombre: '', tipo: 'Fijo', monto: 0, obligatorio: true };

  get conceptosVisibles(): Concepto[] {
    return this.conceptosService.conceptos();
  }

  get puedeEditar(): boolean {
    return this.permisos.puede('conceptos', 'editar');
  }

  get puedeEliminar(): boolean {
    return this.permisos.puede('conceptos', 'eliminar');
  }

  editarConcepto(c: Concepto): void {
    this.editarRef = c;
    this.esNuevo = false;
    this.editarTitulo = 'Editar concepto';
    this.formData = { nombre: c.nombre, tipo: c.tipo, monto: c.monto, obligatorio: c.obligatorio };
    this.editarError = '';
    this.editarVisible = true;
  }

  nuevoConcepto(): void {
    this.editarRef = undefined;
    this.esNuevo = true;
    this.editarTitulo = 'Nuevo concepto';
    const conceptos = this.conceptosService.conceptos();
    const maxOrden = conceptos.reduce((m, c) => Math.max(m, c.orden), 0);
    this.formData = { nombre: '', tipo: 'Fijo', monto: 0, obligatorio: true };
    this.editarError = '';
    this.editarVisible = true;
  }

  cerrarEditar(): void {
    this.editarVisible = false;
    this.editarRef = undefined;
  }

  guardarConcepto(): void {
    if (!this.formData.nombre.trim()) {
      this.editarError = 'El nombre del concepto es obligatorio.';
      return;
    }

    if (this.esNuevo) {
      const conceptos = this.conceptosService.conceptos();
      const maxOrden = conceptos.reduce((m, c) => Math.max(m, c.orden), 0);
      this.conceptosService.agregar({
        orden: maxOrden + 1,
        nombre: this.formData.nombre.trim(),
        tipo: this.formData.tipo,
        monto: Number(this.formData.monto),
        obligatorio: this.formData.obligatorio,
      });
    } else {
      const ref = this.editarRef;
      if (!ref) return;
      this.conceptosService.actualizar(ref.orden, {
        nombre: this.formData.nombre.trim(),
        tipo: this.formData.tipo,
        monto: Number(this.formData.monto),
        obligatorio: this.formData.obligatorio,
      });
    }

    this.cerrarEditar();
  }

  eliminarConcepto(c: Concepto): void {
    this.eliminarRef = c;
    const accion = c.activo ? 'eliminar' : 'restaurar';
    this.confirmarAccion = accion;
    this.confirmarMessage = `¿Estás seguro de ${accion} el concepto "${c.nombre}"?`;
    this.confirmarEliminarVisible = true;
  }

  confirmarEliminar(): void {
    const ref = this.eliminarRef;
    if (!ref) return;

    if (ref.activo) {
      this.conceptosService.eliminar(ref.orden);
    } else {
      this.conceptosService.restaurar(ref.orden);
    }

    this.confirmarEliminarVisible = false;
    this.eliminarRef = undefined;
  }

  clonar(): void {
    // Disabled functionality
  }
}
