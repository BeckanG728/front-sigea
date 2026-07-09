import { Injectable, signal, WritableSignal } from '@angular/core';
import { DataService } from '../../core/services/data.service';

export interface Concepto {
  orden: number;
  nombre: string;
  tipo: string;
  monto: number;
  obligatorio: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConceptosService {
  private readonly _conceptos: WritableSignal<Concepto[]>;

  get conceptos() {
    return this._conceptos;
  }

  constructor(private data: DataService) {
    this._conceptos = signal<Concepto[]>(
      this.data.conceptos2026().map(c => ({ ...c, activo: true }))
    );
  }

  agregar(concepto: Omit<Concepto, 'activo'>): void {
    const nuevo: Concepto = { ...concepto, activo: true };
    this._conceptos.update(cs => [...cs, nuevo]);
  }

  actualizar(orden: number, data: { nombre: string; tipo: string; monto: number; obligatorio: boolean }): void {
    this._conceptos.update(cs => {
      const idx = cs.findIndex(c => c.orden === orden);
      if (idx === -1) return cs;
      cs = [...cs];
      cs[idx] = { ...cs[idx], ...data };
      return cs;
    });
  }

  eliminar(orden: number): void {
    this._conceptos.update(cs => {
      const idx = cs.findIndex(c => c.orden === orden);
      if (idx === -1) return cs;
      cs = [...cs];
      cs[idx] = { ...cs[idx], activo: false };
      return cs;
    });
  }

  restaurar(orden: number): void {
    this._conceptos.update(cs => {
      const idx = cs.findIndex(c => c.orden === orden);
      if (idx === -1) return cs;
      cs = [...cs];
      cs[idx] = { ...cs[idx], activo: true };
      return cs;
    });
  }
}
