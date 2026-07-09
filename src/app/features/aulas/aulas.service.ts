import { Injectable } from '@angular/core';
import { DataService, Aula, AlumnoAula } from '../../core/services/data.service';

@Injectable({ providedIn: 'root' })
export class AulasService {
  constructor(private data: DataService) {}

  get aulas() {
    return this.data.aulas;
  }

  get alumnosAula4() {
    return this.data.alumnosAula4;
  }
}
