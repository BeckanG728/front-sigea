import { Injectable, inject, computed } from '@angular/core';
import { ConceptoApiService, ConceptoResponse } from '../../core/services/concepto-api.service';

export interface Concepto {
  id: number;
  orden: number;
  nombre: string;
  tipo: string;
  tipoConceptoNombre: string;
  monto: number;
  obligatorio: boolean;
  activo: boolean;
  version: number;
}

function mapResponse(r: ConceptoResponse): Concepto {
  return {
    id: r.id,
    orden: r.ordenPago,
    nombre: r.nombreConcepto,
    tipo: r.tipo,
    tipoConceptoNombre: r.tipoConceptoNombre,
    monto: r.monto,
    obligatorio: r.obligatorio,
    activo: r.estado,
    version: r.version,
  };
}

@Injectable({ providedIn: 'root' })
export class ConceptosService {
  private api = inject(ConceptoApiService);

  readonly conceptos = computed(() => this.api.conceptos().map(mapResponse));
  readonly tiposConcepto = computed(() => this.api.tiposConcepto());
  readonly loading = computed(() => this.api.loading());
  readonly totalPages = computed(() => this.api.totalPages());
  readonly currentPage = computed(() => this.api.currentPage());
  readonly totalElements = computed(() => this.api.totalElements());

  async listar(anioAcademicoId?: number, page: number = 0): Promise<void> {
    await this.api.listar(anioAcademicoId, page);
  }

  async crear(data: {
    codAnioAcademico: number;
    codTipoConcepto: number;
    nombreConcepto: string;
    monto: number;
    ordenPago: number;
    obligatorio: boolean;
    tipo: string;
  }): Promise<void> {
    await this.api.crear(data);
  }

  async actualizar(id: number, data: {
    codAnioAcademico: number;
    codTipoConcepto: number;
    nombreConcepto: string;
    monto: number;
    ordenPago: number;
    obligatorio: boolean;
    tipo: string;
    version: number;
  }): Promise<void> {
    await this.api.actualizar(id, data);
  }

  async eliminar(id: number): Promise<void> {
    await this.api.eliminar(id);
  }

  async cargarTiposConcepto(): Promise<void> {
    await this.api.cargarTiposConcepto();
  }

  async cargarAnioActivo(): Promise<{ id: number; anio: number }> {
    return await this.api.cargarAnioActivo();
  }

  async clonar(anioOrigen: number, anioDestino: number): Promise<{ conceptosClonados: number; anioDestino: number }> {
    return await this.api.clonar({ anioOrigen, anioDestino });
  }
}