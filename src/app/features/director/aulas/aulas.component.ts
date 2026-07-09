import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-director-aulas',
  standalone: true,
  imports: [],
  templateUrl: './aulas.html',
})
export class DirectorAulasComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Aulas');
    this.shellState.icon.set('bi bi-door-open');
  }
}
