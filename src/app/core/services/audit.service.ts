import { Injectable, signal } from '@angular/core';

export interface AuditEvent {
  n: number;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  detalle: string;
  ip: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  readonly eventos = signal<AuditEvent[]>([]);
  private counter = 0;

  log(usuario: string, accion: string, modulo: string, detalle: string): void {
    this.counter++;
    const evento: AuditEvent = {
      n: this.counter,
      fecha: new Date().toLocaleString('es-PE'),
      usuario,
      modulo,
      accion,
      detalle,
      ip: '127.0.0.1',
    };
    this.eventos.update(e => [evento, ...e]);
  }
}
