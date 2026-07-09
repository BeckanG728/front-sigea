import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoBadge',
  standalone: true,
})
export class EstadoBadgePipe implements PipeTransform {
  transform(estado: string): string {
    const map: Record<string, string> = {
      activo: 'badge badge--success',
      activa: 'badge badge--success',
      pagado: 'badge badge--success',
      pendiente: 'badge badge--warning',
      pagar: 'badge badge--warning',
      bloqueado: 'badge badge--neutral',
      eliminado: 'badge badge--danger',
      deuda: 'badge badge--danger',
      trasladada: 'badge badge--info',
    };
    return map[estado.toLowerCase()] ?? 'badge badge--neutral';
  }
}
