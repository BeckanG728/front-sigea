import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ShellStateService } from '../../core/services/shell-state.service';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [],
  templateUrl: './alumnos.html',
})
export class AlumnosComponent {
  private router = inject(Router);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Alumnos');
    this.shellState.icon.set('bi-mortarboard');
  }

  guardar(): void {
    this.router.navigate(['/secretaria/aulas']);
  }

  cancelar(): void {
    this.router.navigate(['/secretaria/aulas']);
  }
}
