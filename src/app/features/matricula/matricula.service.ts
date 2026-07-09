import { Injectable } from '@angular/core';
import { DataService, Aula, Cuota } from '../../core/services/data.service';

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  constructor(private data: DataService) {}

  get aulas() {
    return this.data.aulas;
  }

  get cuotasCarlosChinga2026() {
    return this.data.cuotasCarlosChinga2026;
  }
}
