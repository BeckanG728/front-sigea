import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TwoFactorAuthComponent } from '../../../shared/two-factor-auth/two-factor-auth.component';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.html',
  standalone: true,
  imports: [TwoFactorAuthComponent],
})
export class ChangePasswordComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Seguridad de mi cuenta');
    this.shellState.icon.set('bi bi-shield-lock');
  }

  errorMsg = signal('');
  feedback = signal('');

  submitClave(actual: string, nueva: string, confirmar: string): void {
    this.errorMsg.set('');

    if (nueva.length < 8) {
      this.errorMsg.set('La clave nueva debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      this.errorMsg.set('La clave nueva y su confirmación no coinciden.');
      return;
    }
    if (nueva === actual) {
      this.errorMsg.set('La clave nueva no puede ser igual a la clave actual.');
      return;
    }

    this.auth.changePassword(actual, nueva).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.feedback.set(res.message || 'Clave actualizada correctamente');
        setTimeout(() => this.feedback.set(''), 3000);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Error al cambiar la contraseña');
      }
    });
  }

  cancelar(): void {
    const role = this.auth.role();
    if (role?.key === 'superusuario') {
      this.router.navigate(['/su/usuarios']);
    } else if (role?.key === 'director') {
      this.router.navigate(['/director']);
    } else {
      this.router.navigate(['/secretaria/matricula']);
    }
  }
}
