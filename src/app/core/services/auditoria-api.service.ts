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

@Injectable({ providedIn: 'root' })
export class AuditoriaApiService {
  private http = inject(HttpClient);
  readonly items = signal<AuditoriaItem[]>([]);

  async cargar(filtros?: { modulo?: string; desde?: string; hasta?: string }): Promise<void> {
    const params: any = {};
    if (filtros?.modulo) params.modulo = filtros.modulo;
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;

    const res = await lastValueFrom(
      this.http.get<ApiAuditoriaResponse[]>(`${environment.apiUrl}/api/reportes/auditoria`, { params })
    );

    this.items.set(res.map((r, i) => ({
      n: i + 1,
      fecha: new Date(r.fechaHora).toLocaleString('es-PE'),
      usuario: r.nombreUsuario,
      modulo: r.modulo,
      tabla: r.tablaAfectada,
      operacion: r.operacion,
      registro: r.codigoRegistro ?? '',
      ip: r.ipOrigen,
    })));
  }
}
