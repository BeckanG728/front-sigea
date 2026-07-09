import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportesService, MorosidadItem, IngresoMes, AlumnosPorAula } from './reportes.service';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from '../../core/services/shell-state.service';

type ReportType = 'morosidad' | 'ingresos' | 'alumnos';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reportes.html',
})
export class ReportesComponent {
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor(private svc: ReportesService) {
    this.shellState.title.set('Reportes');
    this.shellState.icon.set('bi bi-file-earmark-bar-graph');
  }

  readonly reportType = signal<ReportType>('morosidad');

  readonly types: { value: ReportType; label: string }[] = [
    { value: 'morosidad', label: 'Morosidad' },
    { value: 'ingresos', label: 'Ingresos por mes' },
    { value: 'alumnos', label: 'Alumnos por aula' },
  ];

  protected get morosidad() { return this.svc.getMorosidad(); }
  protected get ingresosPorMes() { return this.svc.getIngresosPorMes(); }
  protected get alumnosPorAula() { return this.svc.getAlumnosPorAula(); }

  readonly columns = computed<{ key: string; label: string }[]>(() => {
    switch (this.reportType()) {
      case 'morosidad':
        return [
          { key: 'alumno', label: 'Alumno' },
          { key: 'cuotasVencidas', label: 'Cuotas vencidas' },
          { key: 'montoDeuda', label: 'Monto deuda' },
          { key: 'ultimoPago', label: 'Último pago' },
        ];
      case 'ingresos':
        return [
          { key: 'mes', label: 'Mes' },
          { key: 'monto', label: 'Monto' },
          { key: 'cantidadPagos', label: 'Cant. pagos' },
        ];
      case 'alumnos':
        return [
          { key: 'aula', label: 'Aula' },
          { key: 'nivel', label: 'Nivel' },
          { key: 'grado', label: 'Grado' },
          { key: 'matriculados', label: 'Matriculados' },
          { key: 'cupoMaximo', label: 'Cupo máximo' },
        ];
    }
  });

  readonly data = computed(() => {
    switch (this.reportType()) {
      case 'morosidad':
        return this.morosidad() as unknown[];
      case 'ingresos':
        return this.ingresosPorMes() as unknown[];
      case 'alumnos':
        return this.alumnosPorAula() as unknown[];
    }
  });

  exportCSV(): void {
    const cols = this.columns();
    const rows = this.data();
    const header = cols.map(c => c.label).join(',');
    const body = rows.map((r: any) =>
      cols.map(c => `"${r[c.key]}"`).join(',')
    ).join('\n');
    const csv = header + '\n' + body;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${this.reportType()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
