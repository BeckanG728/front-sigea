import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-table-actions',
  standalone: true,
  templateUrl: './table-actions.html',
})
export class TableActionsComponent {
  readonly puedeEditar = input(false);
  readonly puedeEliminar = input(false);
  readonly puedeVer = input(false);
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly view = output<void>();
}
