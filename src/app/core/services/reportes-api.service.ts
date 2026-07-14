import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

// ── Catálogos ────────────────────────────────────────────────────────────────
export interface AnioAcademico {
  id: number;
  anio: number;
  estado: boolean;
}

export interface Nivel {
  id: number;
  nombre: string;
}

// ── GET /api/reportes/vacantes (se usa en Matrícula y Vacantes) ──────────────
export interface VacanteReporte {
  codAula: number;
  descripcion: string;
  anioAcademico: number;
  nivel: string;
  grado: string;
  seccion: string;
  capacidadMaxima: number;
  matriculados: number;
  vacantesDisponibles: number;
}

// ── GET /api/reportes/deudas/detalle ─────────────────────────────────────────
export interface DeudaDetalle {
  codCuota: number;
  alumno: string;
  documento: string;
  concepto: string;
  monto: number;
  fechaVencimiento: string; // ISO yyyy-MM-dd
  diasAtraso: number;
  estado: 'PENDIENTE' | 'BLOQUEADA';
}

// ── GET /api/reportes/caja ───────────────────────────────────────────────────
export interface CajaFila {
  anio: number;
  mes: number;
  nombreMes: string;
  concepto: string;
  cantidadPagos: number;
  total: number;
}

export interface CajaReporte {
  totalIngresos: number;
  totalEgresos: number;
  saldoNeto: number;
  ingresos: CajaFila[];
}

@Injectable({ providedIn: 'root' })
export class ReportesApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getAnios(): Promise<AnioAcademico[]> {
    return lastValueFrom(
      this.http.get<AnioAcademico[]>(`${this.base}/anios-academicos`)
    );
  }

  getNiveles(): Promise<Nivel[]> {
    return lastValueFrom(this.http.get<Nivel[]>(`${this.base}/niveles`));
  }

  /** OJO: anioAcademico y nivel son los IDs, no el número de año ni el nombre. */
  getVacantes(anioAcademicoId?: number | null, nivelId?: number | null): Promise<VacanteReporte[]> {
    const params: Record<string, number> = {};
    if (anioAcademicoId) params['anioAcademico'] = anioAcademicoId;
    if (nivelId) params['nivel'] = nivelId;
    return lastValueFrom(
      this.http.get<VacanteReporte[]>(`${this.base}/reportes/vacantes`, { params })
    );
  }

  /** anio = número de año (2026). estado opcional: PENDIENTE | BLOQUEADA. */
  getDeudasDetalle(anio?: number | null, estado?: string | null): Promise<DeudaDetalle[]> {
    const params: Record<string, string | number> = {};
    if (anio) params['anio'] = anio;
    if (estado) params['estados'] = estado;
    return lastValueFrom(
      this.http.get<DeudaDetalle[]>(`${this.base}/reportes/deudas/detalle`, { params })
    );
  }

  /** desde/hasta en ISO local, ej. 2026-01-01T00:00:00 */
  getCaja(desde: string, hasta: string): Promise<CajaReporte> {
    return lastValueFrom(
      this.http.get<CajaReporte>(`${this.base}/reportes/caja`, {
        params: { desde, hasta },
      })
    );
  }

  /**
   * Descarga un CSV compatible con Excel en español
   * (separador ';' y BOM UTF-8 para que respete las tildes).
   */
  exportarCsv(nombreArchivo: string, cabeceras: string[], filas: (string | number)[][]): void {
    const escapar = (valor: string | number) => {
      const s = String(valor ?? '');
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const contenido = [cabeceras, ...filas]
      .map(fila => fila.map(escapar).join(';'))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}