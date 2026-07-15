import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

export interface MatriculaDashboardRow {
  n: number;
  alumno: string;
  aula: string;
  fecha: string;
  estado: string;
  registradoPor: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DashboardResponse {
  totalMatriculas: number;
  totalAulasActivas: number;
  pagosPendientes: number;
  matriculasRecientes: PageResponse<MatriculaDashboardRow>;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/dashboard`;

  async cargarResumen(page: number): Promise<DashboardResponse> {
    return await lastValueFrom(
      this.http.get<DashboardResponse>(this.base, {
        params: { page: String(page), size: '7' }
      })
    );
  }

  async exportarMatriculas(): Promise<MatriculaDashboardRow[]> {
    return await lastValueFrom(
      this.http.get<MatriculaDashboardRow[]>(`${this.base}/exportar`)
    );
  }
}
