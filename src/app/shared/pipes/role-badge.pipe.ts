import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleBadge',
  standalone: true,
})
export class RoleBadgePipe implements PipeTransform {
  transform(role: string): string {
    const map: Record<string, string> = {
      superusuario: 'badge badge--su',
      director: 'badge badge--director',
      secretaria: 'badge badge--secretaria',
    };
    return map[role.toLowerCase()] ?? 'badge';
  }
}
