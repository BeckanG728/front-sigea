import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CrearUsuarioRequest, UsuarioResponse, PageResponse, SimpleResponse } from '../../../core/models/usuario-api.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  listar(page: number = 0, size: number = 20): Observable<PageResponse<UsuarioResponse>> {
    return this.http.get<PageResponse<UsuarioResponse>>(
      `${this.API}/api/usuarios?page=${page}&size=${size}`
    );
  }

  crear(data: CrearUsuarioRequest): Observable<SimpleResponse> {
    return this.http.post<SimpleResponse>(`${this.API}/api/usuarios`, data);
  }

  actualizar(id: number, data: CrearUsuarioRequest): Observable<SimpleResponse> {
    return this.http.put<SimpleResponse>(`${this.API}/api/usuarios/${id}`, data);
  }

  eliminar(id: number): Observable<SimpleResponse> {
    return this.http.patch<SimpleResponse>(`${this.API}/api/usuarios/${id}`, {});
  }
}
