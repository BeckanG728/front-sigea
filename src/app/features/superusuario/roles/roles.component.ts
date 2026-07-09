import { Component, inject } from '@angular/core';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [],
  templateUrl: './roles.html',
})
export class RolesComponent {
  private shellState = inject(ShellStateService);
  constructor() {
    this.shellState.title.set('Roles');
    this.shellState.icon.set('bi bi-person-badge');
  }
}
