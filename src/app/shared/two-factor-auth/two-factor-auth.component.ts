import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import QRCode from 'qrcode';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-two-factor-auth',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './two-factor-auth.html',
})
export class TwoFactorAuthComponent {
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('passwordInput') passwordInputRef!: ElementRef<HTMLInputElement>;

  isActive = signal(false);
  step1Visible = signal(false);
  step2Visible = signal(false);
  qrModalVisible = signal(false);
  step1Error = signal('');
  generatedSecret = signal('');
  currentSecret = signal('');
  otpauthUrl = signal('');
  qrDataUrl = signal('');

  constructor() {
    this.isActive.set(this.auth.dosFactorActivo());
    this.otpauthUrl.set(this.auth.secreto2FA() ?? '');
    this.currentSecret.set(this._extractSecret(this.otpauthUrl()));
    if (this.otpauthUrl()) {
      this._generarQR(this.otpauthUrl()).then(url => this.qrDataUrl.set(url));
    }
  }

  iniciarActivacion(): void {
    this.step1Visible.set(true);
    this.step1Error.set('');
  }

  confirmarPassword(): void {
    const password = this.passwordInputRef?.nativeElement?.value ?? '';
    if (!password) {
      this.step1Error.set('Ingresa tu contraseña actual.');
      return;
    }
    this.step1Error.set('');
    this.auth.enable2FA(password).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: async (res) => {
        this.isActive.set(res.dosFactorHabilitado);
        this.otpauthUrl.set(res.secretoQr);
        this.generatedSecret.set(this._extractSecret(res.secretoQr));
        this.currentSecret.set(this.generatedSecret());
        this.qrDataUrl.set(await this._generarQR(res.secretoQr));
        this.step1Visible.set(false);
        this.step2Visible.set(true);
      },
      error: (err) => {
        this.step1Error.set(err.error?.message || 'Error al activar 2FA');
      }
    });
  }

  async verQR(): Promise<void> {
    if (!this.otpauthUrl()) return;
    this.qrDataUrl.set(await this._generarQR(this.otpauthUrl()));
    this.qrModalVisible.set(true);
  }

  private _extractSecret(uri: string): string {
    try {
      return new URL(uri).searchParams.get('secret') || '';
    } catch {
      return '';
    }
  }

  private async _generarQR(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, { width: 180 });
    } catch {
      return '';
    }
  }
}
