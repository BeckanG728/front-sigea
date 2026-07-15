import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alumno, Aula, ObligacionPago, MatriculaRegistrada, DeudaAnterior } from '../../core/services/data.service';
import { AulaListado } from '../../core/services/aula-api.service';
import { ConceptoResponse } from '../../core/services/concepto-api.service';
import { AlumnoResponse, AlumnoBusquedaResponse } from '../../core/services/alumno-api.service';

export interface AnioAcademico {
  id: number;
  anio: number;
  estado: boolean;
}

export interface PreviewResponse {
  valido: boolean;
  errores: string[];
  alumno: Alumno;
  aula: Aula;
  anio: AnioAcademico;
  conceptos: ConceptoResponse[];
  total: number;
  cupos: { capacidad: number; matriculados: number; vacantes: number };
  totpVerificado: boolean;
}

export interface RegisterResponse {
  exito: boolean;
  matricula: MatriculaRegistrada;
  obligaciones: ObligacionPago[];
}

function mapAula(a: AulaListado, periodo: number): Aula {
  return {
    cod: a.id,
    nivel: a.nivel,
    grado: a.grado,
    seccion: a.seccion,
    cupo: a.matriculados,
    max: a.capacidadMaxima,
    estado: a.estado,
    periodo,
  };
}

function mapAlumno(a: AlumnoResponse): Alumno {
  return {
    id: a.id,
    documento: a.numeroDocumento,
    paterno: a.apellidoPaterno,
    materno: a.apellidoMaterno,
    nombre: a.nombres,
    estado: true,
  };
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private http = inject(HttpClient);

  readonly aniosAcademicos = signal<AnioAcademico[]>([]);
  readonly conceptos = signal<ConceptoResponse[]>([]);
  readonly aulas = signal<Aula[]>([]);
  readonly alumnos = signal<Alumno[]>([]);
  readonly deudas = signal<DeudaAnterior[]>([]);

  async cargarAniosAcademicos(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<AnioAcademico[]>(`${environment.apiUrl}/api/anios-academicos`)
    );
    this.aniosAcademicos.set(res);
  }

  async cargarConceptos(anio: number): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<ConceptoResponse[]>(`${environment.apiUrl}/api/conceptos`, {
        params: { anio: String(anio) }
      })
    );
    this.conceptos.set(res);
  }

  async cargarAulas(anioId: number, anioPeriodo: number): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<AulaListado[]>(`${environment.apiUrl}/api/aulas`, {
        params: { anioAcademico: String(anioId) }
      })
    );
    this.aulas.set(res.map(a => mapAula(a, anioPeriodo)));
  }

  async cargarAlumnos(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<AlumnoResponse[]>(`${environment.apiUrl}/api/alumnos`)
    );
    this.alumnos.set(res.map(mapAlumno));
  }

  async buscarAlumnoPorDni(dni: string): Promise<AlumnoBusquedaResponse | null> {
    const res = await lastValueFrom(
      this.http.get<AlumnoBusquedaResponse[]>(`${environment.apiUrl}/api/alumnos/documento/${dni}`)
    );
    return res && res.length > 0 ? res[0] : null;
  }

  async buscarAulas(anioId: number, nivelId?: number, gradoId?: number): Promise<AulaListado[]> {
    const params: Record<string, string> = { anioAcademico: String(anioId) };
    if (nivelId) params['nivel'] = String(nivelId);
    if (gradoId) params['grado'] = String(gradoId);
    return await lastValueFrom(
      this.http.get<AulaListado[]>(`${environment.apiUrl}/api/aulas`, { params })
    );
  }

  async cargarAnioActivo(): Promise<AnioAcademico> {
    return await lastValueFrom(
      this.http.get<AnioAcademico>(`${environment.apiUrl}/api/anios-academicos/activo`)
    );
  }

  preview(alumnoId: number, aulaId: number, anioId: number): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>(`${environment.apiUrl}/api/matricula/preview`, {
      alumnoId,
      aulaId,
      anioId,
    });
  }

  register(alumnoId: number, aulaId: number, anioId: number, codigoTotp: string, conceptosActivosIds: number[]): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/api/matricula/register`, {
      alumnoId,
      aulaId,
      anioId,
      codigoTotp,
      conceptosActivos: conceptosActivosIds,
    });
  }

  async cargarDeudas(alumnoId: number): Promise<void> {
    if (!alumnoId) { this.deudas.set([]); return; }
    const res = await lastValueFrom(
      this.http.get<DeudaAnterior[]>(`${environment.apiUrl}/api/matricula/deudas`, {
        params: { alumnoId: String(alumnoId) },
      })
    );
    this.deudas.set(res);
  }
}
