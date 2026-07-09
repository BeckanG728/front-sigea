import { Component, computed, signal, inject } from '@angular/core';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

interface Buscable {
  paterno: string;
  materno: string;
  nombre: string;
}

@Component({
  selector: 'app-director-matricula',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './director-matricula.html',
})
export class DirectorMatriculaComponent {
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor(private data: DataService) {
    this.shellState.title.set('Matrícula');
    this.shellState.icon.set('bi bi-pencil-square');
  }

  protected get cuotas() { return this.data.cuotasCarlosChinga2026; }

  protected readonly buscables: Buscable[] = [
    { paterno: 'Chinga', materno: 'Ramos', nombre: 'Carlos' },
    { paterno: 'Chinga', materno: 'López', nombre: 'Ana' },
  ];

  protected readonly aulasActivas = computed(() =>
    this.data.aulas().filter(a => a.estado === 'activo')
  );

  protected modalAlumnoVisible = signal(false);
  protected modalAulaVisible = signal(false);

  buscarAlumno(): void {
    this.modalAlumnoVisible.set(true);
  }

  buscarAula(): void {
    this.modalAulaVisible.set(true);
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      activa: 'badge badge--success',
      activo: 'badge badge--success',
      pendiente: 'badge badge--warning',
      pagado: 'badge badge--success',
      pagar: 'badge badge--warning',
      bloqueado: 'badge badge--neutral',
      trasladada: 'badge badge--info',
      deuda: 'badge badge--danger',
      eliminado: 'badge badge--danger',
    };
    return map[estado] || 'badge badge--neutral';
  }
}
