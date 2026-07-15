import { Injectable, inject, computed, signal } from '@angular/core';
import { PagoApiService, CuotaDeudaResponse, DeudaHistorialResponse } from '../../core/services/pago-api.service';
import { ReportesApiService } from '../../core/services/reportes-api.service';

export interface CuotaView {
  codCuota: number;
  orden: number;
  concepto: string;
  monto: number;
  estado: string;
  bloqueado: boolean;
}

export interface DeudaHistorialView {
  codCuota: number;
  codAlumno: number;
  tipoDocumento: string;
  numeroDocumento: string;
  alumno: string;
  concepto: string;
  anioAcademico: number;
  monto: number;
  estado: string;
}

function mapCuota(r: CuotaDeudaResponse): CuotaView {
  return {
    codCuota: r.codCuota,
    orden: r.ordenPago,
    concepto: r.nombreConcepto,
    monto: r.montoPagar,
    estado: r.estadoCuota,
    bloqueado: r.estadoCuota === 'BLOQUEADA',
  };
}

function mapHistorial(r: DeudaHistorialResponse): DeudaHistorialView {
  return {
    codCuota: r.codCuota,
    codAlumno: r.codAlumno,
    tipoDocumento: r.tipoDocumento,
    numeroDocumento: r.numeroDocumento,
    alumno: r.alumno,
    concepto: r.concepto,
    anioAcademico: r.anioAcademico,
    monto: r.monto,
    estado: r.estado,
  };
}

@Injectable({ providedIn: 'root' })
export class PagosService {
  private api = inject(PagoApiService);
  private reportesApi = inject(ReportesApiService);

  readonly cuotas = computed(() => this.api.cuotas().map(mapCuota));
  readonly loading = computed(() => this.api.loading());
  readonly deudasHistorial = signal<DeudaHistorialView[]>([]);

  readonly cuotasAlumno = signal<CuotaView[]>([]);
  readonly cuotasAlumnoCompleto = signal<CuotaView[]>([]);
  readonly cuotasAlumnoLoading = signal(false);
  readonly cuotasPage = signal(0);
  readonly cuotasTotalPages = signal(0);
  readonly cuotasTotalElements = signal(0);
  readonly historialLoading = signal(false);
  readonly historialPage = signal(0);
  readonly historialTotalPages = signal(0);
  readonly historialTotalElements = signal(0);
  readonly cantidadAlumnosDeudores = signal(0);
  readonly totalDeudaGeneral = signal(0);

  async listarDeudas(codAlumno: number): Promise<void> {
    await this.api.listarDeudas(codAlumno);
  }

  async listarCuotasAlumno(codAlumno: number, page: number = 0): Promise<void> {
    this.cuotasAlumnoLoading.set(true);
    try {
      const [res, todas] = await Promise.all([
        this.api.listarCuotasAlumno(codAlumno, page),
        this.api.listarTodasCuotasAlumno(codAlumno)
      ]);
      this.cuotasAlumno.set(res.content.map(mapCuota));
      this.cuotasAlumnoCompleto.set(todas.map(mapCuota));
      this.cuotasPage.set(res.page);
      this.cuotasTotalPages.set(res.totalPages);
      this.cuotasTotalElements.set(res.totalElements);
    } finally {
      this.cuotasAlumnoLoading.set(false);
    }
  }

  async exportarCuotasAlumno(codAlumno: number): Promise<void> {
    const rows = await this.api.listarTodasCuotasAlumno(codAlumno);
    const cabeceras = ['#', 'Concepto', 'Monto', 'Estado'];
    const filas = rows.map(r => [
      r.ordenPago,
      r.nombreConcepto,
      r.montoPagar,
      r.estadoCuota === 'PENDIENTE' ? 'Pendiente' : r.estadoCuota === 'BLOQUEADA' ? 'Bloqueado' : 'Pagado'
    ]);
    this.reportesApi.exportarCsv('cuotas-alumno.csv', cabeceras, filas);
  }

  async listarHistorialGeneral(page: number = 0): Promise<void> {
    this.historialLoading.set(true);
    try {
      const res = await this.api.listarHistorialGeneral(page);
      this.deudasHistorial.set(res.content.map(mapHistorial));
      this.historialPage.set(res.page);
      this.historialTotalPages.set(res.totalPages);
      this.historialTotalElements.set(res.totalElements);
      this.cantidadAlumnosDeudores.set(res.cantidadAlumnosDeudores);
      this.totalDeudaGeneral.set(res.totalDeuda);
    } finally {
      this.historialLoading.set(false);
    }
  }

  async registrarPago(data: {
    codCuota: number;
    montoPagado: number;
    medioPago: string;
  }): Promise<{ numeroRecibo: string }> {
    const res = await this.api.registrarPago(data);
    return { numeroRecibo: res.numeroRecibo };
  }
}