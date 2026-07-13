import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

export interface TipoDocumento {
  id: number;
  descripcion: string;
}

export interface AlumnoRequest {
  codTipoDocumento: number;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
}

export interface AlumnoResponse {
  id: number;
  codigo: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
}

@Injectable({ providedIn: 'root' })
export class AlumnoApiService {
  private http = inject(HttpClient);

  readonly tiposDocumento = signal<TipoDocumento[]>([]);
  readonly loading = signal(false);

  async cargarTiposDocumento(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<TipoDocumento[]>(`${environment.apiUrl}/api/tipos-documento`)
    );
    this.tiposDocumento.set(res);
  }

  async crearAlumno(data: AlumnoRequest): Promise<AlumnoResponse> {
    return await lastValueFrom(
      this.http.post<AlumnoResponse>(`${environment.apiUrl}/api/alumnos`, data)
    );
  }
}
