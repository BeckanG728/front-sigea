import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-registrar-matricula',
  standalone: true,
  imports: [],
  templateUrl: './registrar-matricula.html',
})
export class RegistrarMatriculaComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Registrar Matrícula');
    this.shellState.icon.set('bi bi-pencil-square');
  }
}
