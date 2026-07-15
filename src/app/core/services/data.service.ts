import { Injectable, signal } from '@angular/core';

export interface Usuario {
  id: number;
  nombre: string;
  doc: string;
  rol: string;
  estado: string;
  noEliminable?: boolean;
  bloqueado: boolean;
  permisosVisibles: boolean;
  secreto2FA: string | null;
}

export interface Alumno {
  id: number;
  documento: string;
  paterno: string;
  materno: string;
  nombre: string;
  estado: boolean;
}

export interface ObligacionPago {
  id: number;
  conceptoId: number;
  nombreConcepto: string;
  monto: number;
  estado: string;
  fechaVencimiento: string;
  ordenPago: number;
  saldoPendiente: number;
}

export interface Aula {
  cod: number;
  nivel: string;
  grado: string;
  seccion: string;
  cupo: number;
  max: number;
  estado: boolean;
  periodo: number;
}

export interface DeudaAnterior {
  concepto: string;
  monto: number;
  fecha: string;
  estado: string;
  recibo: string | null;
}

export interface MatriculaRegistrada {
  id: number;
  alumnoId: number;
  aulaId: number;
  anioId: number;
  fecha: string;
  estado: string;
  usuarioId: number;
}

export interface ParametroItem {
  id: number;
  nombre_parametro: string;
  valor_parametro: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly usuarios = signal<Usuario[]>([]);
}
