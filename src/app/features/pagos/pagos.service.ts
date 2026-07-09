import { Injectable } from '@angular/core';
import { DataService, Cuota, DeudaAnterior } from '../../core/services/data.service';

@Injectable({ providedIn: 'root' })
export class PagosService {
  constructor(private data: DataService) {}

  get cuotasCarlosChinga2026() {
    return this.data.cuotasCarlosChinga2026;
  }

  get deuda2025CarlosChinga() {
    return this.data.deuda2025CarlosChinga;
  }
}
