import { Component, inject, signal } from '@angular/core';
import { DataService, ParametroItem } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [],
  templateUrl: './parametros.html',
})
export class ParametrosComponent {
  data = inject(DataService);
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Parámetros');
    this.shellState.icon.set('bi bi-gear');
  }

  saving = signal('');
  feedback = signal('');
  
  valorEditado(id: number, valor: string): void {
    /*
    this.data.parametrosLista.update(lista =>
      lista.map(p => p.id === id ? { ...p, valor_parametro: valor } : p)
    );
    */
  }

  guardar(): void {
    /*
    const lista = this.data.parametrosLista();
    const p = this.data.parametros();
    for (const item of lista) {
      switch (item.id) {
        case 1: p.anioAcademico = Number(item.valor_parametro); break;
        case 2: p.moneda = item.valor_parametro; break;
        case 3: p.intentosFallidosMax = Number(item.valor_parametro); break;
        case 4: p.minutosBloqueoTemporal = Number(item.valor_parametro); break;
        case 5: p.minutosExpiracionSesion = Number(item.valor_parametro); break;
        case 6: p.claveDefecto = item.valor_parametro; break;
      }
    }
    this.data.parametros.set({ ...p });

    this.saving.set('Parámetros guardados');
    setTimeout(() => this.saving.set(''), 1200);
    this.feedback.set('Parámetros guardados correctamente.');
    setTimeout(() => this.feedback.set(''), 3000);
    */
  }

  restaurar(): void {
    /*
    const p = this.data.parametros();
    this.data.parametrosLista.set([
      { id: 1, nombre_parametro: 'Año académico activo',     valor_parametro: String(p.anioAcademico) },
      { id: 2, nombre_parametro: 'Moneda',                    valor_parametro: p.moneda },
      { id: 3, nombre_parametro: 'Intentos fallidos máx.',    valor_parametro: String(p.intentosFallidosMax) },
      { id: 4, nombre_parametro: 'Minutos bloqueo temporal',  valor_parametro: String(p.minutosBloqueoTemporal) },
      { id: 5, nombre_parametro: 'Minutos expiración sesión', valor_parametro: String(p.minutosExpiracionSesion) },
      { id: 6, nombre_parametro: 'Clave por defecto',         valor_parametro: p.claveDefecto },
    ]);
    */
  }
}
