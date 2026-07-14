import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

export interface AuditoriaItem {
  n: number;
  fecha: string;
  usuario: string;
  modulo: string;
  tabla: string;
  operacion: string;
  registro: string;
  ip: string;
}

export interface ApiAuditoriaResponse {
  id: number;
  codUsuario: number;
  nombreUsuario: string;
  modulo: string;
  tablaAfectada: string;
  operacion: string;
  codigoRegistro: string;
  fechaHora: string;
  ipOrigen: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface FiltrosAuditoria {
  modulo: string;
  operacion: string;
  desde: string;
  hasta: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaApiService {
  private http = inject(HttpClient);

  readonly items = signal<AuditoriaItem[]>([]);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);

  async cargar(page: number, filtros: FiltrosAuditoria): Promise<void> {
    const params: any = { page, size: 5 };
    if (filtros.modulo) params.modulo = filtros.modulo;
    if (filtros.operacion) params.operacion = filtros.operacion;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;

    const res = await lastValueFrom(
      this.http.get<PageResponse<ApiAuditoriaResponse>>(
        `${environment.apiUrl}/api/reportes/auditoria`, { params }
      )
    );

    this.items.set(res.content.map((r, i) => ({
      n: res.pageNumber * res.pageSize + i + 1,
      fecha: new Date(r.fechaHora).toLocaleString('es-PE'),
      usuario: r.nombreUsuario,
      modulo: r.modulo,
      tabla: r.tablaAfectada,
      operacion: r.operacion,
      registro: r.codigoRegistro ?? '',
      ip: r.ipOrigen,
    })));
    this.totalPages.set(res.totalPages);
    this.currentPage.set(res.pageNumber);
  }

  async cargarTodos(filtros: FiltrosAuditoria): Promise<AuditoriaItem[]> {
    const params: any = { page: 0, size: 10000 };
    if (filtros.modulo) params.modulo = filtros.modulo;
    if (filtros.operacion) params.operacion = filtros.operacion;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;

    const res = await lastValueFrom(
      this.http.get<PageResponse<ApiAuditoriaResponse>>(
        `${environment.apiUrl}/api/reportes/auditoria`, { params }
      )
    );

    return res.content.map((r, i) => ({
      n: i + 1,
      fecha: new Date(r.fechaHora).toLocaleString('es-PE'),
      usuario: r.nombreUsuario,
      modulo: r.modulo,
      tabla: r.tablaAfectada,
      operacion: r.operacion,
      registro: r.codigoRegistro ?? '',
      ip: r.ipOrigen,
    }));
  }
}
