import { Injectable, signal } from '@angular/core';

export interface Usuario {
  id: number;
  nombre: string;
  username: string;
  doc: string;
  rol: string;
  estado: string;
  noEliminable?: boolean;
  bloqueado: boolean;
  permisosVisibles: boolean;
  dosFactorActivo: boolean;
  secreto2FA: string | null;
}

export interface Aula {
  cod: number;
  nivel: string;
  grado: string;
  seccion: string;
  cupo: number;
  max: number;
  estado: string;
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
  readonly usuarios = signal<Usuario[]>([
    { id: 1, nombre: 'Admin', username: 'admin', doc: '—', rol: 'superusuario', estado: 'activo', noEliminable: true, bloqueado: false, permisosVisibles: true, dosFactorActivo: false, secreto2FA: null },
    { id: 2, nombre: 'Juan Ríos', username: 'director01', doc: 'DNI 47112233', rol: 'director', estado: 'activo', bloqueado: true, permisosVisibles: true, dosFactorActivo: false, secreto2FA: null },
    { id: 3, nombre: 'María Torres', username: 'secretaria01', doc: 'DNI 52009871', rol: 'secretaria', estado: 'activo', bloqueado: false, permisosVisibles: true, dosFactorActivo: false, secreto2FA: null },
    { id: 4, nombre: 'Luis Paz', username: 'secretaria02', doc: 'DNI 31007654', rol: 'secretaria', estado: 'eliminado', bloqueado: false, permisosVisibles: true, dosFactorActivo: false, secreto2FA: null },
  ]);

  readonly parametros = signal<Parametros>({
    anioAcademico: 2026,
    moneda: 'PEN',
    intentosFallidosMax: 3,
    minutosBloqueoTemporal: 15,
    minutosExpiracionSesion: 30,
    claveDefecto: 'Sigea@2026',
  });

  readonly parametrosLista = signal<ParametroItem[]>([
    { id: 1, nombre_parametro: 'Año académico activo',     valor_parametro: '2026' },
    { id: 2, nombre_parametro: 'Moneda',                    valor_parametro: 'PEN' },
    { id: 3, nombre_parametro: 'Intentos fallidos máx.',    valor_parametro: '3' },
    { id: 4, nombre_parametro: 'Minutos bloqueo temporal',  valor_parametro: '15' },
    { id: 5, nombre_parametro: 'Minutos expiración sesión', valor_parametro: '30' },
    { id: 6, nombre_parametro: 'Clave por defecto',         valor_parametro: 'Sigea@2026' },
  ]);

  readonly modulos: Modulo[] = [
    { key: 'usuarios', label: 'Usuarios', desc: 'Control total de usuarios, roles y asignación de permisos del sistema' },
    { key: 'matriculas', label: 'Matrículas', desc: 'Registrar y administrar matrículas de alumnos por año académico' },
    { key: 'pagos', label: 'Pagos', desc: 'Registrar pagos de cuotas y generar recibos' },
    { key: 'alumnos', label: 'Alumnos', desc: 'Administrar el registro de alumnos' },
    { key: 'aulas', label: 'Aulas', desc: 'Administrar aulas, secciones y asignación de cupos' },
    { key: 'conceptos', label: 'Conceptos', desc: 'Administrar el tarifario (conceptos) por año académico' },
    { key: 'reportes', label: 'Reportes avanzados', desc: 'Generar y exportar reportes del sistema' },
  ];

  readonly subPermisos: SubPermiso[] = [
    { key: 'ver', label: 'Ver', desc: 'Consultar los registros del módulo' },
    { key: 'crear', label: 'Crear', desc: 'Registrar nuevos elementos' },
    { key: 'editar', label: 'Editar', desc: 'Modificar registros existentes' },
    { key: 'eliminar', label: 'Eliminar', desc: 'Eliminar registros (baja lógica)' },
    { key: 'imprimir', label: 'Imprimir', desc: 'Generar e imprimir reportes o comprobantes' },
  ];

  private fullPerm = (): PermisoMap => ({ ver: true, crear: true, editar: true, eliminar: true, imprimir: true });
  private readPerm = (): PermisoMap => ({ ver: true, crear: false, editar: false, eliminar: false, imprimir: true });

  readonly permisosPorRol = signal<{ [rol: string]: { [modKey: string]: PermisoMap } }>({
    superusuario: Object.fromEntries(this.modulos.map(m => [m.key, this.fullPerm()])),
    director: Object.fromEntries(
      this.modulos.filter(m => m.key !== 'usuarios').map(m => [m.key, this.readPerm()])
    ),
    secretaria: Object.fromEntries(
      this.modulos.filter(m => ['matriculas', 'pagos', 'alumnos', 'aulas', 'conceptos'].includes(m.key))
        .map(m => [m.key, this.fullPerm()])
    ),
  });

  readonly aulas = signal<Aula[]>([
    { cod: 1, nivel: 'Inicial', grado: '3 años', seccion: 'A', cupo: 20, max: 25, estado: 'activo' },
    { cod: 2, nivel: 'Inicial', grado: '3 años', seccion: 'B', cupo: 18, max: 25, estado: 'activo' },
    { cod: 3, nivel: 'Primaria', grado: '1°', seccion: 'A', cupo: 30, max: 35, estado: 'activo' },
    { cod: 4, nivel: 'Secundaria', grado: '1°', seccion: 'A', cupo: 35, max: 35, estado: 'activo' },
    { cod: 5, nivel: 'Secundaria', grado: '2°', seccion: 'A', cupo: 28, max: 28, estado: 'eliminado' },
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

  readonly auditoria = signal<AuditoriaEvento[]>([
    { n: 1, fecha: '28/06/2025 11:40:33', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Cuota', operacion: 'Actualizacion', registro: 'Matrícula S/ 200 -> S/ 250', ip: '192.168.1.25' },
    { n: 2, fecha: '28/06/2025 09:16:21', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Matrícula', operacion: 'Insercion', registro: 'Matrícula 2026 - 4 cuotas', ip: '192.168.1.25' },
    { n: 3, fecha: '28/06/2025 09:15:04', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Alumno', operacion: 'Insercion', registro: 'Cód. 8149 - Torres Quispe, María', ip: '192.168.1.25' },
    { n: 4, fecha: '28/06/2025 09:17:03', usuario: 'secretaria01', modulo: 'Matrícula', tabla: 'Cuota', operacion: 'Insercion', registro: 'Cuota 1 - Matrícula - S/ 200', ip: '192.168.1.25' },
    { n: 5, fecha: '28/06/2025 10:05:15', usuario: 'secretaria01', modulo: 'Pagos', tabla: 'Pago', operacion: 'Insercion', registro: 'Pago Cuota 1 - Recibo N° R000123', ip: '192.168.1.25' },
    { n: 6, fecha: '28/06/2025 10:06:06', usuario: 'secretaria01', modulo: 'Pagos', tabla: 'Recibo', operacion: 'Insercion', registro: 'Recibo N° R000123 - S/ 200', ip: '192.168.1.25' },
  ]);
}
