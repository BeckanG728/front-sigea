import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { AuditService } from '../../core/services/audit.service';
import { DataService } from '../../core/services/data.service';

interface FiltrosAuditoria {
  fecha: string;
  modulo: string;
  usuario: string;
  operacion: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auditoria.html',
})
export class AuditoriaComponent {
  readonly PAGE_SIZE = 10;
  readonly page = signal(1);
  readonly filtros = signal<FiltrosAuditoria>({
    fecha: '',
    modulo: '',
    usuario: '',
    operacion: '',
  });

  constructor(
    readonly data: DataService,
    private auth: AuthService,
    private shellState: ShellStateService,
  ) {
    this.shellState.title.set('Auditoría');
    this.shellState.icon.set('bi bi-clock-history');
  }

  readonly modulos = computed(() =>
    [...new Set(this.data.auditoria().map(a => a.modulo))].sort(),
  );
  readonly usuarios = computed(() =>
    [...new Set(this.data.auditoria().map(a => a.usuario))].sort(),
  );
  readonly operaciones = computed(() =>
    [...new Set(this.data.auditoria().map(a => a.operacion))].sort(),
  );

  readonly filtered = computed(() => {
    const f = this.filtros();
    return this.data.auditoria().filter(a => {
      if (f.fecha && !a.fecha.toLowerCase().includes(f.fecha.toLowerCase())) return false;
      if (f.modulo && a.modulo !== f.modulo) return false;
      if (f.usuario && a.usuario !== f.usuario) return false;
      if (f.operacion && a.operacion !== f.operacion) return false;
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.PAGE_SIZE)),
  );

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.PAGE_SIZE;
    return this.filtered().slice(start, start + this.PAGE_SIZE);
  });

  readonly pages = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    const range: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (cur > 3) range.push('…');
      const lo = Math.max(2, cur - 1);
      const hi = Math.min(total - 1, cur + 1);
      for (let i = lo; i <= hi; i++) range.push(i);
      if (cur < total - 2) range.push('…');
      range.push(total);
    }
    return range;
  });

  goToPage(p: number | string): void {
    if (typeof p === 'number' && p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
    }
  }

  onFilterChange(): void {
    this.page.set(1);
  }
}
