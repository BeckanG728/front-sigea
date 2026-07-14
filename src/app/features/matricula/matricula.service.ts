import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DataService, Aula, Alumno, AnioAcademico, Concepto, ObligacionPago, MatriculaReciente, DeudaAnterior } from '../../core/services/data.service';

export interface PreviewResponse {
  valido: boolean;
  errores: string[];
  alumno: Alumno;
  aula: Aula;
  anio: AnioAcademico;
  conceptos: Concepto[];
  total: number;
  cupos: { capacidad: number; matriculados: number; vacantes: number };
}

export interface RegisterResponse {
  exito: boolean;
  matricula: MatriculaReciente;
  obligaciones: ObligacionPago[];
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  constructor(private data: DataService) {}

  get aulas() { return this.data.aulas; }
  get aniosAcademicos() { return this.data.aniosAcademicos; }
  get alumnos() { return this.data.alumnos; }
  get conceptos2026() { return this.data.conceptos2026; }
  get matriculasRecientes() { return this.data.matriculasRecientes2026; }
  get deuda2025() { return this.data.deuda2025CarlosChinga; }

  private readonly deudasPorAlumno = new Map<number, DeudaAnterior[]>([
    [1, [
      { concepto: 'Matrícula 2025', monto: 200, fecha: '05/03/25', estado: 'pagado', recibo: 'BOL-2025-001' },
      { concepto: 'Marzo 2025', monto: 100, fecha: '01/04/25', estado: 'pagado', recibo: 'BOL-2025-018' },
      { concepto: 'Abril 2025', monto: 100, fecha: '02/05/25', estado: 'pagado', recibo: 'BOL-2025-031' },
      { concepto: 'Diciembre 2025', monto: 100, fecha: '—', estado: 'pendiente', recibo: null },
    ]],
  ]);

  getDeudasByAlumno(alumnoId: number): DeudaAnterior[] {
    return this.deudasPorAlumno.get(alumnoId) ?? [];
  }

  private nombreCompleto(alumno: Alumno): string {
    return `${alumno.paterno} ${alumno.materno}, ${alumno.nombre}`;
  }

  preview(alumnoId: number, aulaId: number, anioId: number): Observable<PreviewResponse> {
    const alumno = this.alumnos().find(a => a.id === alumnoId);
    const aula = this.aulas().find(a => a.cod === aulaId);
    const anio = this.aniosAcademicos().find(a => a.id === anioId);
    const errores: string[] = [];

    if (!alumno) errores.push('El alumno no existe.');
    else if (alumno.estado !== 'activo') errores.push('El alumno se encuentra inactivo.');

    if (!aula) errores.push('El aula no existe.');
    else if (aula.estado !== 'activo') errores.push('El aula no se encuentra activa.');
    else if (aula.cupo >= aula.max) errores.push('No existen vacantes disponibles.');

    if (!anio) errores.push('El año académico no existe.');
    else if (!anio.permiteMatriculas) errores.push('El año académico no permite nuevas matrículas.');

    if (alumno && anio) {
      const nombreCompleto = this.nombreCompleto(alumno);
      const yaMatriculado = this.matriculasRecientes().some(
        m => m.alumno === nombreCompleto && m.estado === 'activa'
      );
      if (yaMatriculado) {
        errores.push('El alumno ya se encuentra matriculado en este año académico.');
      }
    }

    if (alumno) {
      const deudasPendientes = this.getDeudasByAlumno(alumno.id).filter(d => d.estado === 'pendiente');
      if (deudasPendientes.length > 0) {
        errores.push('El alumno posee deudas anteriores pendientes.');
      }
    }

    const conceptos = this.conceptos2026();
    if (conceptos.length === 0) {
      errores.push('No existen conceptos de pago configurados para el año académico.');
    }

    const total = conceptos.filter(c => c.obligatorio).reduce((s, c) => s + c.monto, 0);

    const response: PreviewResponse = {
      valido: errores.length === 0,
      errores,
      alumno: alumno ?? { id: 0, documento: '', paterno: '', materno: '', nombre: '', estado: '' },
      aula: aula ?? { cod: 0, nivel: '', grado: '', seccion: '', cupo: 0, max: 0, estado: '', periodo: 0 },
      anio: anio ?? { id: 0, anio: 0, estado: '', permiteMatriculas: false },
      conceptos,
      total,
      cupos: {
        capacidad: aula?.max ?? 0,
        matriculados: aula?.cupo ?? 0,
        vacantes: (aula?.max ?? 0) - (aula?.cupo ?? 0),
      },
    };

    return of(response);
  }

  register(alumnoId: number, aulaId: number, anioId: number, conceptosActivos: Concepto[]): Observable<RegisterResponse> {
    const alumno = this.alumnos().find(a => a.id === alumnoId);
    const aula = this.aulas().find(a => a.cod === aulaId);
    const anio = this.aniosAcademicos().find(a => a.id === anioId);

    if (!alumno || !aula || !anio) {
      return of({ exito: false, matricula: {} as MatriculaReciente, obligaciones: [] });
    }

    this.aulas.update(list => {
      const idx = list.findIndex(a => a.cod === aula.cod);
      if (idx === -1) return list;
      const updated = [...list];
      updated[idx] = { ...updated[idx], cupo: updated[idx].cupo + 1 };
      return updated;
    });

    const aulaLabel = `${aula.nivel} ${aula.grado} ${aula.seccion}`;
    const nombreCompleto = this.nombreCompleto(alumno);
    const newMatricula: MatriculaReciente = {
      n: this.matriculasRecientes().length + 1,
      alumno: nombreCompleto,
      aula: aulaLabel,
      fecha: new Date().toLocaleDateString('es-PE'),
      estado: 'activa',
      registradoPor: 'secretaria01',
    };

    this.matriculasRecientes.update(list => [newMatricula, ...list]);

    const obligaciones: ObligacionPago[] = conceptosActivos.map((c, i) => ({
      id: i + 1,
      concepto: c.nombre,
      monto: c.monto,
      estado: 'pendiente',
      fechaVencimiento: new Date(anio.anio, i + 2, 15).toLocaleDateString('es-PE'),
      ordenPago: c.orden,
      saldoPendiente: c.monto,
    }));

    return of({ exito: true, matricula: newMatricula, obligaciones });
  }
}
