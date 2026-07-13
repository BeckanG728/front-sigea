import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from '../../core/services/shell-state.service';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [],
  templateUrl: './panel-inicio.html',
})
export class PanelInicioComponent {
  protected auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Inicio');
    this.shellState.icon.set('bi bi-house-door');
  }
}
