import { Injectable, signal } from '@angular/core';

export interface MorosidadItem {
  alumno: string;
  cuotasVencidas: number;
  montoDeuda: number;
  ultimoPago: string;
}

export interface IngresoMes {
  mes: string;
  monto: number;
  cantidadPagos: number;
}

export interface AlumnosPorAula {
  aula: string;
  nivel: string;
  grado: string;
  matriculados: number;
  cupoMaximo: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly _morosidad = signal<MorosidadItem[]>([
    { alumno: 'Chinga Ramos, Carlos', cuotasVencidas: 2, montoDeuda: 200, ultimoPago: '15/03/2026' },
    { alumno: 'Quispe Meza, Pedro', cuotasVencidas: 3, montoDeuda: 350, ultimoPago: '01/02/2026' },
    { alumno: 'Ramos Cruz, Ana', cuotasVencidas: 1, montoDeuda: 100, ultimoPago: '10/04/2026' },
    { alumno: 'López Díaz, Lucía', cuotasVencidas: 0, montoDeuda: 0, ultimoPago: '05/05/2026' },
    { alumno: 'Torres Quispe, María', cuotasVencidas: 4, montoDeuda: 500, ultimoPago: '20/12/2025' },
  ]);

  private readonly _ingresosPorMes = signal<IngresoMes[]>([
    { mes: 'Enero', monto: 12000, cantidadPagos: 45 },
    { mes: 'Febrero', monto: 15000, cantidadPagos: 52 },
    { mes: 'Marzo', monto: 18000, cantidadPagos: 60 },
    { mes: 'Abril', monto: 14000, cantidadPagos: 48 },
    { mes: 'Mayo', monto: 16500, cantidadPagos: 55 },
    { mes: 'Junio', monto: 13000, cantidadPagos: 42 },
  ]);

  private readonly _alumnosPorAula = signal<AlumnosPorAula[]>([
    { aula: '3A', nivel: 'Inicial', grado: '3 años', matriculados: 20, cupoMaximo: 25 },
    { aula: '3B', nivel: 'Inicial', grado: '3 años', matriculados: 18, cupoMaximo: 25 },
    { aula: '1A', nivel: 'Primaria', grado: '1°', matriculados: 30, cupoMaximo: 35 },
    { aula: '1A', nivel: 'Secundaria', grado: '1°', matriculados: 35, cupoMaximo: 35 },
    { aula: '2A', nivel: 'Secundaria', grado: '2°', matriculados: 25, cupoMaximo: 28 },
  ]);

  getMorosidad() {
    return this._morosidad;
  }

  getIngresosPorMes() {
    return this._ingresosPorMes;
  }

  getAlumnosPorAula() {
    return this._alumnosPorAula;
  }
}
