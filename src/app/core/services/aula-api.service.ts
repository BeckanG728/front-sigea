import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

export interface AulaListado {
  id: number;
  codigo: string;
  nivel: string;
  grado: string;
  seccion: string;
  capacidadMaxima: number;
  matriculados: number;
  vacantes: number;
  estado: boolean;
}

export interface AlumnoAula {
  codigo: string;
  nombreCompleto: string;
  fechaMatricula: string;
  estadoMatricula: boolean;
}

export interface Nivel {
  id: number;
  nombre: string;
}

export interface Grado {
  id: number;
  nombreGrado: string;
  codNivel: number;
}

export interface AnioAcademico {
  id: number;
  anio: number;
  estado: boolean;
}

export interface AulaRequest {
  codAnioAcademico: number;
  codNivel: number;
  codGrado: number;
  seccion: string;
  capacidadMaxima: number;
}

@Injectable({ providedIn: 'root' })
export class AulaApiService {
  private http = inject(HttpClient);

  readonly aulas = signal<AulaListado[]>([]);
  readonly alumnosAula = signal<AlumnoAula[]>([]);
  readonly niveles = signal<Nivel[]>([]);
  readonly grados = signal<Grado[]>([]);
  readonly anioActivo = signal<AnioAcademico | null>(null);
  readonly loading = signal(false);

  async cargarAnioActivo(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<AnioAcademico>(`${environment.apiUrl}/api/anios-academicos/activo`)
    );
    this.anioActivo.set(res);
  }

  async cargarAulas(anioAcademico?: number, nivel?: number): Promise<void> {
    this.loading.set(true);
    try {
      const params: any = {};
      if (anioAcademico) params.anioAcademico = anioAcademico;
      if (nivel) params.nivel = nivel;
      const res = await lastValueFrom(
        this.http.get<AulaListado[]>(`${environment.apiUrl}/api/aulas`, { params })
      );
      this.aulas.set(res);
    } finally {
      this.loading.set(false);
    }
  }

  async cargarAlumnosAula(aulaId: number): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<AlumnoAula[]>(`${environment.apiUrl}/api/aulas/${aulaId}/alumnos`)
    );
    this.alumnosAula.set(res);
  }

  async cargarNiveles(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<Nivel[]>(`${environment.apiUrl}/api/niveles`)
    );
    this.niveles.set(res);
  }

  async cargarGrados(): Promise<void> {
    const res = await lastValueFrom(
      this.http.get<Grado[]>(`${environment.apiUrl}/api/grados`)
    );
    this.grados.set(res);
  }

  async crearAula(data: AulaRequest): Promise<void> {
    await lastValueFrom(
      this.http.post(`${environment.apiUrl}/api/aulas`, data)
    );
  }

  async editarAula(id: number, data: AulaRequest): Promise<void> {
    await lastValueFrom(
      this.http.put(`${environment.apiUrl}/api/aulas/${id}`, data)
    );
  }

  async eliminarAula(id: number): Promise<void> {
    await lastValueFrom(
      this.http.delete(`${environment.apiUrl}/api/aulas/${id}`)
    );
  }
}
