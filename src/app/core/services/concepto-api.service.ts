import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

export interface TipoConcepto {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface ConceptoResponse {
  id: number;
  nombreConcepto: string;
  monto: number;
  ordenPago: number;
  obligatorio: boolean;
  tipo: string;
  estado: boolean;
  tipoConceptoId: number;
  tipoConceptoNombre: string;
  anioAcademicoId: number;
  anioAcademico: number;
  version: number;
}

export interface ConceptoRequest {
  codAnioAcademico: number;
  codTipoConcepto: number;
  nombreConcepto: string;
  monto: number;
  ordenPago: number;
  obligatorio: boolean;
  tipo: string;
  version?: number;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ClonadoRequest {
  anioOrigen: number;
  anioDestino: number;
}

export interface ClonadoResponse {
  conceptosClonados: number;
  anioDestino: number;
}

export interface AnioAcademico {
  id: number;
  anio: number;
  estado: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConceptoApiService {
  private http = inject(HttpClient);

  readonly conceptos = signal<ConceptoResponse[]>([]);
  readonly tiposConcepto = signal<TipoConcepto[]>([]);
  readonly loading = signal(false);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly totalElements = signal(0);

  async listar(anioAcademicoId?: number, page: number = 0): Promise<void> {
    this.loading.set(true);
    try {
      const params: any = { page, size: 6 };
      if (anioAcademicoId) params.anioAcademicoId = anioAcademicoId;
      const res = await lastValueFrom(
        this.http.get<PageResponse<ConceptoResponse>>(`${environment.apiUrl}/api/conceptos`, { params })
      );
      this.conceptos.set(res.content);
      this.totalPages.set(res.totalPages);
      this.currentPage.set(res.pageNumber);
      this.totalElements.set(res.totalElements);
    } finally {
      this.loading.set(false);
    }
  }

  async crear(data: ConceptoRequest): Promise<ConceptoResponse> {
    return await lastValueFrom(
      this.http.post<ConceptoResponse>(`${environment.apiUrl}/api/conceptos`, data)
    );
  }

  async actualizar(id: number, data: ConceptoRequest): Promise<ConceptoResponse> {
    return await lastValueFrom(
      this.http.put<ConceptoResponse>(`${environment.apiUrl}/api/conceptos/${id}`, data)
    );
  }

  async eliminar(id: number): Promise<void> {
    await lastValueFrom(
      this.http.delete(`${environment.apiUrl}/api/conceptos/${id}`)
    );
  }

  async cargarTiposConcepto(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<TipoConcepto[]>(`${environment.apiUrl}/api/tipos-concepto`)
    );
    this.tiposConcepto.set(res);
  }

  async cargarAnioActivo(): Promise<AnioAcademico> {
    return await lastValueFrom(
      this.http.get<AnioAcademico>(`${environment.apiUrl}/api/anios-academicos/activo`)
    );
  }

  async clonar(data: ClonadoRequest): Promise<ClonadoResponse> {
    return await lastValueFrom(
      this.http.post<ClonadoResponse>(`${environment.apiUrl}/api/conceptos/clonar`, data)
    );
  }
}