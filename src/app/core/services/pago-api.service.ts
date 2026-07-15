import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

export interface CuotaDeudaResponse {
  codCuota: number;
  codMatricula: number;
  montoPagar: number;
  ordenPago: number;
  estadoCuota: string;
  nombreConcepto: string;
  anioAcademico: number;
}

export interface PaginatedCuotasResponse {
  content: CuotaDeudaResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RegistrarPagoRequest {
  codCuota: number;
  montoPagado: number;
  medioPago: string;
}

export interface DeudaHistorialResponse {
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

export interface HistorialGeneralResponse {
  content: DeudaHistorialResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  cantidadAlumnosDeudores: number;
  totalDeuda: number;
}

export interface PagoResponse {
  codPago: number;
  codCuota: number;
  numeroRecibo: string;
  montoPagado: number;
  medioPago: string;
  fechaPago: string;
}

@Injectable({ providedIn: 'root' })
export class PagoApiService {
  private http = inject(HttpClient);

  readonly cuotas = signal<CuotaDeudaResponse[]>([]);
  readonly loading = signal(false);

  async listarDeudas(codAlumno: number): Promise<void> {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.http.get<CuotaDeudaResponse[]>(`${environment.apiUrl}/api/pagos/deudas`, {
          params: { codAlumno }
        })
      );
      this.cuotas.set(res);
    } finally {
      this.loading.set(false);
    }
  }

  async listarHistorialGeneral(page: number = 0): Promise<HistorialGeneralResponse> {
    return await lastValueFrom(
      this.http.get<HistorialGeneralResponse>(`${environment.apiUrl}/api/pagos/historial`, {
        params: { page, size: 7 }
      })
    );
  }

  async listarCuotasAlumno(codAlumno: number, page: number = 0): Promise<PaginatedCuotasResponse> {
    return await lastValueFrom(
      this.http.get<PaginatedCuotasResponse>(`${environment.apiUrl}/api/pagos/cuotas`, {
        params: { codAlumno, page, size: 3 }
      })
    );
  }

  async listarTodasCuotasAlumno(codAlumno: number): Promise<CuotaDeudaResponse[]> {
    return await lastValueFrom(
      this.http.get<CuotaDeudaResponse[]>(`${environment.apiUrl}/api/pagos/cuotas/todas`, {
        params: { codAlumno }
      })
    );
  }

  async registrarPago(data: RegistrarPagoRequest): Promise<PagoResponse> {
    return await lastValueFrom(
      this.http.post<PagoResponse>(`${environment.apiUrl}/api/pagos`, data)
    );
  }
}