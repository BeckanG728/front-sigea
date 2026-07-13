import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShellStateService } from '../../core/services/shell-state.service';
import { AlumnoApiService, AlumnoRequest } from '../../core/services/alumno-api.service';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './alumnos.html',
})
export class AlumnosComponent implements OnInit {
  private alumnoApi = inject(AlumnoApiService);
  private router = inject(Router);
  private shellState = inject(ShellStateService);

  readonly tiposDocumento = this.alumnoApi.tiposDocumento;
  readonly loading = this.alumnoApi.loading;
  readonly error = signal('');

  data: AlumnoRequest = {
    codTipoDocumento: 0,
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
  };

  constructor() {
    this.shellState.title.set('Nuevo Alumno');
    this.shellState.icon.set('bi-mortarboard');
  }

  ngOnInit(): void {
    this.alumnoApi.cargarTiposDocumento();
  }

  async guardar(): Promise<void> {
    if (!this.validar()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.alumnoApi.crearAlumno(this.data);
      this.router.navigate(['/su/aulas']);
    } catch (e: any) {
      this.error.set(e.error?.mensaje || 'Error al crear alumno');
    } finally {
      this.loading.set(false);
    }
  }

  private validar(): boolean {
    if (!this.data.codTipoDocumento) {
      this.error.set('Seleccione un tipo de documento');
      return false;
    }
    if (!this.data.numeroDocumento.trim()) {
      this.error.set('Ingrese número de documento');
      return false;
    }
    if (!this.data.nombres.trim()) {
      this.error.set('Ingrese nombres');
      return false;
    }
    if (!this.data.apellidoPaterno.trim()) {
      this.error.set('Ingrese apellido paterno');
      return false;
    }
    if (!this.data.apellidoMaterno.trim()) {
      this.error.set('Ingrese apellido materno');
      return false;
    }
    if (!this.data.fechaNacimiento) {
      this.error.set('Ingrese fecha de nacimiento');
      return false;
    }
    return true;
  }

  cancelar(): void {
    this.router.navigate(['/su/aulas']);
  }
}
