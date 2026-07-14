import { Component } from '@angular/core';

@Component({
  selector: 'app-pagos',
  standalone: true,
  template: `
    <div class="card" style="text-align:center;padding:32px">
      <p><a href="/pagos/registrar">Registrar Pago</a> &middot; <a href="/pagos/deudas">Historial de Deudas</a></p>
    </div>
  `,
})
export class PagosComponent {}