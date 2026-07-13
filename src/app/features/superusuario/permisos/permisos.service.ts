import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoleResponse, CrearRoleRequest } from '../../../core/models/role-api.model';
import { PermisoPorFuncionalidad, GuardarPermisosRequest } from '../../../core/models/funcionalidad-api.model';

@Injectable({ providedIn: 'root' })
export class PermisosService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  listarRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(`${this.API}/api/roles`);
  }

  crearRol(data: CrearRoleRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(`${this.API}/api/roles`, data);
  }

  eliminarRol(idRol: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/api/roles/${idRol}`);
  }

  obtenerPermisos(idRol: number): Observable<PermisoPorFuncionalidad[]> {
    return this.http.get<PermisoPorFuncionalidad[]>(`${this.API}/api/roles/${idRol}/permisos`);
  }

  guardarPermisos(idRol: number, data: GuardarPermisosRequest): Observable<void> {
    return this.http.put<void>(`${this.API}/api/roles/${idRol}/permisos`, data);
  }
}
