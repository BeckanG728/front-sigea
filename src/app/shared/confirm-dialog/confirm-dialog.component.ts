import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialogComponent {
  readonly visible = input(false);
  readonly title = input('Confirmar');
  readonly message = input('');
  readonly confirmText = input('Eliminar');
  readonly cancelText = input('Cancelar');
  readonly variant = input<'danger' | 'dark'>('danger');
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
