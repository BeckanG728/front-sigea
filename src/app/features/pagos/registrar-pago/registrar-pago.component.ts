import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { AlumnoApiService, AlumnoBusquedaResponse } from '../../../core/services/alumno-api.service';
import { PagosService, CuotaView } from '../pagos.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-registrar-pago',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './registrar-pago.html',
})
export class RegistrarPagoComponent implements OnInit {
  private alumnoApi = inject(AlumnoApiService);
  private pagosService = inject(PagosService);
  private shellState = inject(ShellStateService);
  private route = inject(ActivatedRoute);

  constructor() {
    this.shellState.title.set('Registrar Pago');
    this.shellState.icon.set('bi bi-cash');
  }

  ngOnInit(): void {
    const doc = this.route.snapshot.queryParamMap.get('documento');
    if (doc) {
      this.dniBusqueda = doc;
      this.buscarAlumno();
    }
  }

  dniBusqueda = '';
  buscando = false;
  alumnoSeleccionado = signal<AlumnoBusquedaResponse | null>(null);
  error = '';
  pagoExitoso = '';

  pagarVisible = false;
  pagarCuota: CuotaView | null = null;
  medioPago = 'EFECTIVO';
  pagando = false;
  pagoError = '';

  page = signal(0);

  cuotas = this.pagosService.cuotasAlumno;
  cuotasCompleto = this.pagosService.cuotasAlumnoCompleto;
  loading = this.pagosService.cuotasAlumnoLoading;
  totalPages = this.pagosService.cuotasTotalPages;
  totalElements = this.pagosService.cuotasTotalElements;

  async buscarAlumno(): Promise<void> {
    const numDoc = this.dniBusqueda.trim();
    if (!numDoc) return;

    this.buscando = true;
    this.error = '';
    this.alumnoSeleccionado.set(null);
    try {
      const resultados = await this.alumnoApi.buscarPorDocumento(numDoc);
      if (resultados.length === 0) {
        this.error = 'No se encontró un alumno con ese número de documento.';
        return;
      }
      const alumno = resultados[0];
      this.alumnoSeleccionado.set(alumno);
      this.page.set(0);
      await this.pagosService.listarCuotasAlumno(alumno.id, 0);
    } catch (e) {
      this.error = 'Error al buscar alumno.';
    } finally {
      this.buscando = false;
    }
  }

  async goToPage(p: number): Promise<void> {
    const alumno = this.alumnoSeleccionado();
    if (!alumno) return;
    this.page.set(p);
    await this.pagosService.listarCuotasAlumno(alumno.id, p);
  }

  async exportar(): Promise<void> {
    const alumno = this.alumnoSeleccionado();
    if (!alumno) return;
    await this.pagosService.exportarCuotasAlumno(alumno.id);
  }

  abrirPago(c: CuotaView): void {
    this.pagarCuota = c;
    this.medioPago = 'EFECTIVO';
    this.pagoError = '';
    this.pagarVisible = true;
  }

  cerrarPago(): void {
    this.pagarVisible = false;
    this.pagarCuota = null;
  }

  async confirmarPago(): Promise<void> {
    const cuota = this.pagarCuota;
    if (!cuota) return;

    this.pagando = true;
    this.pagoError = '';
    try {
      const { numeroRecibo } = await this.pagosService.registrarPago({
        codCuota: cuota.codCuota,
        montoPagado: cuota.monto,
        medioPago: this.medioPago,
      });
      this.pagoExitoso = `Pago registrado — Recibo ${numeroRecibo}`;
      this.cerrarPago();
      const alumno = this.alumnoSeleccionado();
      if (alumno) {
        await this.pagosService.listarCuotasAlumno(alumno.id, this.page());
      }
    } catch (e: any) {
      this.pagoError = e.error?.message || 'Error al registrar el pago.';
    } finally {
      this.pagando = false;
    }
  }

  totalPagado(): number {
    return this.cuotasCompleto()
      .filter(c => c.estado === 'PAGADA')
      .reduce((s, c) => s + c.monto, 0);
  }

  totalPendiente(): number {
    return this.cuotasCompleto()
      .filter(c => c.estado === 'PENDIENTE')
      .reduce((s, c) => s + c.monto, 0);
  }
}