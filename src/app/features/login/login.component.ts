import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [FormsModule]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  usuario = signal('');
  password = signal('');
  error = signal('');
  show2FA = signal(false);
  twoFAError = signal('');

  login(): void {
    const user = this.usuario().trim();
    const pass = this.password();
    if (!user || !pass) {
      this.error.set('Ingresa usuario y contraseña');
      return;
    }
    this.error.set('');
    this.auth.login(user, pass).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.requiere2FA) {
          this.show2FA.set(true);
          this.twoFAError.set('');
        } else {
          this.router.navigate([this.auth.homeRoute]);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Credenciales inválidas');
      }
    });
  }

  verificar2FA(code: string): void {
    if (!/^\d{6}$/.test(code)) {
      this.twoFAError.set('Código inválido. Ingresa exactamente 6 dígitos.');
      return;
    }
    this.twoFAError.set('');
    this.auth.verify2FA(code).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.router.navigate([this.auth.homeRoute]),
      error: (err) => {
        this.twoFAError.set(err.error?.message || 'Código inválido');
      }
    });
  }

  cerrar2FA(): void {
    this.show2FA.set(false);
    this.twoFAError.set('');
    this.auth.requires2FA.set(false);
  }
}
