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

export interface AnioAcademico {
  id: number;
  anio: number;
  estado: string;
  permiteMatriculas: boolean;
}

export interface Alumno {
  id: number;
  documento: string;
  paterno: string;
  materno: string;
  nombre: string;
  estado: string;
}

export interface ObligacionPago {
  id: number;
  concepto: string;
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
  estado: string;
  periodo: number;
}

export interface AlumnoAula {
  matricula: string;
  nombre: string;
  estado: string;
  registradoPor: string;
}

export interface Concepto {
  orden: number;
  nombre: string;
  tipo: string;
  monto: number;
  obligatorio: boolean;
}

export interface Cuota {
  orden: number;
  concepto: string;
  monto: number;
  estado: string;
}

export interface DeudaAnterior {
  concepto: string;
  monto: number;
  fecha: string;
  estado: string;
  recibo: string | null;
}

export interface MatriculaReciente {
  n: number;
  alumno: string;
  aula: string;
  fecha: string;
  estado: string;
  registradoPor: string;
}

export interface AuditoriaEvento {
  n: number;
  fecha: string;
  usuario: string;
  modulo: string;
  tabla: string;
  operacion: string;
  registro: string;
  ip: string;
}

export interface Parametros {
  anioAcademico: number;
  moneda: string;
  intentosFallidosMax: number;
  minutosBloqueoTemporal: number;
  minutosExpiracionSesion: number;
  claveDefecto: string;
}

export interface ParametroItem {
  id: number;
  nombre_parametro: string;
  valor_parametro: string;
}

export interface Modulo {
  key: string;
  label: string;
  desc: string;
}

export interface SubPermiso {
  key: string;
  label: string;
  desc: string;
}

export type PermisoMap = { [subKey: string]: boolean };

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly usuarios = signal<Usuario[]>([]);

  readonly aniosAcademicos = signal<AnioAcademico[]>([
    { id: 1, anio: 2025, estado: 'cerrado', permiteMatriculas: false },
    { id: 2, anio: 2026, estado: 'activo', permiteMatriculas: true },
  ]);

  readonly alumnos = signal<Alumno[]>([
    { id: 1, documento: '71234567', paterno: 'Chinga', materno: 'Ramos', nombre: 'Carlos', estado: 'activo' },
    { id: 2, documento: '72345678', paterno: 'Chinga', materno: 'López', nombre: 'Ana', estado: 'activo' },
    { id: 3, documento: '73456789', paterno: 'Quispe', materno: 'Meza', nombre: 'Pedro', estado: 'activo' },
    { id: 4, documento: '74567890', paterno: 'Ramos', materno: 'Cruz', nombre: 'Ana', estado: 'inactivo' },
  ]);

  readonly aulas = signal<Aula[]>([
    { cod: 1, nivel: 'Inicial', grado: '3 años', seccion: 'A', cupo: 20, max: 25, estado: 'activo', periodo: 2026 },
    { cod: 2, nivel: 'Inicial', grado: '3 años', seccion: 'B', cupo: 18, max: 25, estado: 'activo', periodo: 2026 },
    { cod: 3, nivel: 'Primaria', grado: '1°', seccion: 'A', cupo: 30, max: 35, estado: 'activo', periodo: 2026 },
    { cod: 4, nivel: 'Secundaria', grado: '1°', seccion: 'A', cupo: 35, max: 35, estado: 'activo', periodo: 2026 },
    { cod: 5, nivel: 'Secundaria', grado: '2°', seccion: 'A', cupo: 28, max: 28, estado: 'eliminado', periodo: 2026 },
  ]);

  readonly alumnosAula4 = signal<AlumnoAula[]>([
    { matricula: '001', nombre: 'Chinga Ramos, Carlos', estado: 'activa', registradoPor: 'sec01' },
    { matricula: '002', nombre: 'López Díaz, Lucía', estado: 'activa', registradoPor: 'sec01' },
    { matricula: '003', nombre: 'Quispe Meza, Pedro', estado: 'pendiente', registradoPor: 'sec01' },
    { matricula: '004', nombre: 'Ramos Cruz, Ana', estado: 'trasladada', registradoPor: 'sec01' },
  ]);

  readonly conceptos2026 = signal<Concepto[]>([
    { orden: 1, nombre: 'Matrícula', tipo: 'Fijo', monto: 200, obligatorio: true },
    { orden: 2, nombre: 'Libro', tipo: 'Fijo', monto: 50, obligatorio: true },
    { orden: 3, nombre: 'Marzo', tipo: 'Mensual', monto: 100, obligatorio: true },
    { orden: 4, nombre: 'Abril', tipo: 'Mensual', monto: 100, obligatorio: true },
    { orden: 5, nombre: 'Taller extra', tipo: 'Opcional', monto: 30, obligatorio: false },
  ]);

  readonly cuotasCarlosChinga2026 = signal<Cuota[]>([
    { orden: 1, concepto: 'Matrícula', monto: 200, estado: 'pagado' },
    { orden: 2, concepto: 'Libro', monto: 50, estado: 'pagado' },
    { orden: 3, concepto: 'Marzo', monto: 100, estado: 'pagar' },
    { orden: 4, concepto: 'Abril', monto: 100, estado: 'bloqueado' },
  ]);

  readonly deuda2025CarlosChinga = signal<DeudaAnterior[]>([
    { concepto: 'Matrícula 2025', monto: 200, fecha: '05/03/25', estado: 'pagado', recibo: 'BOL-2025-001' },
    { concepto: 'Marzo 2025', monto: 100, fecha: '01/04/25', estado: 'pagado', recibo: 'BOL-2025-018' },
    { concepto: 'Abril 2025', monto: 100, fecha: '02/05/25', estado: 'pagado', recibo: 'BOL-2025-031' },
    { concepto: 'Diciembre 2025', monto: 100, fecha: '—', estado: 'pendiente', recibo: null },
  ]);

  readonly matriculasRecientes2026 = signal<MatriculaReciente[]>([
    { n: 1, alumno: 'Chinga Ramos, Carlos', aula: 'Sec. 1° A', fecha: '10/03/2026', estado: 'activa', registradoPor: 'secretaria01' },
    { n: 2, alumno: 'López Díaz, Lucía', aula: 'Prim. 3° B', fecha: '11/03/2026', estado: 'activa', registradoPor: 'secretaria01' },
    { n: 3, alumno: 'Quispe Meza, Pedro', aula: 'Inic. 3A', fecha: '12/03/2026', estado: 'pendiente', registradoPor: 'secretaria01' },
  ]);

  readonly parametros = signal<Parametros>({
    anioAcademico: 2026,
    moneda: 'S/',
    intentosFallidosMax: 3,
    minutosBloqueoTemporal: 30,
    minutosExpiracionSesion: 60,
    claveDefecto: '123456',
  });

  readonly parametrosLista = signal<ParametroItem[]>([
    { id: 1, nombre_parametro: 'Año académico activo',     valor_parametro: '2026' },
    { id: 2, nombre_parametro: 'Moneda',                    valor_parametro: 'S/' },
    { id: 3, nombre_parametro: 'Intentos fallidos máx.',    valor_parametro: '3' },
    { id: 4, nombre_parametro: 'Minutos bloqueo temporal',  valor_parametro: '30' },
    { id: 5, nombre_parametro: 'Minutos expiración sesión', valor_parametro: '60' },
    { id: 6, nombre_parametro: 'Clave por defecto',         valor_parametro: '123456' },
  ]);

  readonly auditoria = signal<AuditoriaEvento[]>([
    { n: 1, fecha: '28/06/2025 11:40:33', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Cuota', operacion: 'Actualizacion', registro: 'Matrícula S/ 200 -> S/ 250', ip: '192.168.1.25' },
    { n: 2, fecha: '28/06/2025 09:16:21', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Matrícula', operacion: 'Insercion', registro: 'Matrícula 2026 - 4 cuotas', ip: '192.168.1.25' },
    { n: 3, fecha: '28/06/2025 09:15:04', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Alumno', operacion: 'Insercion', registro: 'Cód. 8149 - Torres Quispe, María', ip: '192.168.1.25' },
    { n: 4, fecha: '28/06/2025 09:17:03', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Cuota', operacion: 'Insercion', registro: 'Cuota 1 - Matrícula - S/ 200', ip: '192.168.1.25' },
    { n: 5, fecha: '28/06/2025 10:05:15', usuario: 'secretaria01', modulo: 'Pagos', tabla: 'Pago', operacion: 'Insercion', registro: 'Pago Cuota 1 - Recibo N° R000123', ip: '192.168.1.25' },
    { n: 6, fecha: '28/06/2025 10:06:06', usuario: 'secretaria01', modulo: 'Pagos', tabla: 'Recibo', operacion: 'Insercion', registro: 'Recibo N° R000123 - S/ 200', ip: '192.168.1.25' },
  ]);
}
