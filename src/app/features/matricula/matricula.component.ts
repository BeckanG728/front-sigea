import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MatriculaService, AnioAcademico, PreviewResponse, RegisterResponse } from './matricula.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Aula, Alumno } from '../../core/services/data.service';
import { ConceptoResponse } from '../../core/services/concepto-api.service';

type WizardStep = 'selection' | 'confirmation' | 'twofactor' | 'success';

@Component({
  selector: 'app-matricula',
  standalone: true,
  imports: [ModalComponent, FormsModule],
  templateUrl: './matricula.html',
})
export class MatriculaComponent {
  private matriculaService = inject(MatriculaService);
  private shellState = inject(ShellStateService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly moneda = 'S/';

  constructor() {
    this.shellState.title.set('Matrícula');
    this.shellState.icon.set('bi-pencil-square');
    this.cargarDatosIniciales();
  }

  private cargarDatosIniciales(): void {
    this.matriculaService.cargarAniosAcademicos().then(() => this.cargarDatosPorAnio());
    this.matriculaService.cargarAlumnos();
  }

  private cargarDatosPorAnio(): void {
    const anio = this.anioActual();
    if (anio) {
      this.matriculaService.cargarConceptos(anio.id);
      this.matriculaService.cargarAulas(anio.anio);
    }
  }

  // ─── Año ────────────────────────────────────
  readonly aniosAcademicos = this.matriculaService.aniosAcademicos;
  anioSeleccionado = signal(2);

  readonly anioActual = computed<AnioAcademico | undefined>(() =>
    this.aniosAcademicos().find(a => a.id === this.anioSeleccionado())
  );

  onAnioChange(id: number): void {
    this.anioSeleccionado.set(id);
    this.alumnoID.set(0);
    this.aulaId.set(0);
    this.erroresPreview.set([]);
    this.previewData.set(null);
    this.cargarDatosPorAnio();
  }

  // ─── Alumno ─────────────────────────────────
  readonly buscables = this.matriculaService.alumnos;
  alumnoID = signal(0);
  buscarAlumnoVisible = false;

  readonly alumnoActual = computed<Alumno | undefined>(() =>
    this.buscables().find(a => a.id === this.alumnoID())
  );

  abrirBuscarAlumno(): void { this.buscarAlumnoVisible = true; }

  seleccionarAlumno(id: number): void {
    this.alumnoID.set(id);
    this.buscarAlumnoVisible = false;
    this.erroresPreview.set([]);
    this.previewData.set(null);
    this.matriculaService.cargarDeudas(id);
  }

  // ─── Aula ───────────────────────────────────
  aulaId = signal(0);
  buscarAulaVisible = false;

  readonly aulasDisponibles = computed<Aula[]>(() =>
    this.matriculaService.aulas().filter(a =>
      a.estado === true && a.periodo === this.anioActual()?.anio
    )
  );

  get aulaActual(): Aula | undefined {
    return this.matriculaService.aulas().find(a => a.cod === this.aulaId());
  }

  abrirBuscarAula(): void { this.buscarAulaVisible = true; }

  seleccionarAula(cod: number): void {
    this.aulaId.set(cod);
    this.buscarAulaVisible = false;
    this.erroresPreview.set([]);
    this.previewData.set(null);
  }

  // ─── Botón habilitado ───────────────────────
  get puedeMatricular(): boolean {
    if (this.anioActual()?.estado !== true) return false;
    if (this.alumnoID() === 0) return false;
    if (this.aulaId() === 0) return false;
    const aula = this.aulaActual;
    return !!aula && aula.cupo < aula.max;
  }

  // ─── Preview ────────────────────────────────
  loadingPreview = signal(false);
  previewData = signal<PreviewResponse | null>(null);
  erroresPreview = signal<string[]>([]);

  matricular(): void {
    this.erroresPreview.set([]);
    this.previewData.set(null);
    this.loadingPreview.set(true);

    this.matriculaService.preview(this.alumnoID(), this.aulaId(), this.anioSeleccionado()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.loadingPreview.set(false);
      if (!res.valido) {
        this.erroresPreview.set(res.errores);
        return;
      }
      this.previewData.set(res);
      this.conceptosToggle.set(new Map(
        res.conceptos.filter(c => c.obligatorio).map(c => [c.id, true] as [number, boolean])
      ));
      this.paso.set('confirmation');
    });
  }

  // ─── Deudas (para template) ─────────────────
  readonly deudasPendientes = computed(() =>
    this.matriculaService.deudas().filter(d => d.estado === 'pendiente')
  );
  readonly tieneDeudasPendientes = computed(() => this.deudasPendientes().length > 0);

  // ─── Conceptos (para template) ──────────────
  readonly conceptosVista = this.matriculaService.conceptos;

  // ─── Wizard ─────────────────────────────────
  paso = signal<WizardStep>('selection');

  cancelarConfirmacion(): void {
    this.paso.set('selection');
  }

  // ─── Toggle conceptos ───────────────────────
  conceptosToggle = signal<Map<number, boolean>>(new Map());

  toggleConcepto(orden: number): void {
    this.conceptosToggle.update(m => {
      const next = new Map(m);
      next.set(orden, !(next.get(orden) ?? false));
      return next;
    });
  }

  readonly conceptos = computed<ConceptoResponse[]>(() =>
    this.previewData()?.conceptos ?? []
  );

  readonly subtotal = computed(() =>
    this.conceptos()
      .filter(c => c.obligatorio || this.conceptosToggle().get(c.id) === true)
      .reduce((s, c) => s + c.monto, 0)
  );

  readonly descuentos = signal(0);
  readonly recargos = signal(0);

  readonly total = computed(() =>
    this.subtotal() + this.descuentos() + this.recargos()
  );

  // ─── Confirmar → 2FA ────────────────────────
  error2FA = signal('');

  confirmarMatricula(): void {
    this.paso.set('twofactor');
    this.error2FA.set('');
  }

  volverAConfirmacion(): void {
    this.paso.set('confirmation');
    this.error2FA.set('');
  }

  verificar2FA(code: string): void {
    if (!/^\d{6}$/.test(code)) {
      this.error2FA.set('Código de Google Authenticator incorrecto.');
      return;
    }
    this.error2FA.set('');
    this.ejecutar();
  }

  // ─── Ejecutar registro ──────────────────────
  loadingRegistro = signal(false);
  registroData = signal<RegisterResponse | null>(null);

  private ejecutar(): void {
    const conceptosActivosIds = this.conceptos()
      .filter(c => c.obligatorio || this.conceptosToggle().get(c.id) === true)
      .map(c => c.id);

    this.loadingRegistro.set(true);

    this.matriculaService.register(
      this.alumnoID(),
      this.aulaId(),
      this.anioSeleccionado(),
      conceptosActivosIds
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.loadingRegistro.set(false);
      this.registroData.set(res);
      this.paso.set('success');
    });
  }

  // ─── Acciones post-éxito ────────────────────
  resetForm(): void {
    this.paso.set('selection');
    this.alumnoID.set(0);
    this.aulaId.set(0);
    this.erroresPreview.set([]);
    this.previewData.set(null);
    this.registroData.set(null);
    this.error2FA.set('');
    this.conceptosToggle.set(new Map());
    this.descuentos.set(0);
    this.recargos.set(0);
  }

  irARegistrarPago(): void {
    this.router.navigate(['/pagos/registrar']);
  }

  generarConstancia(): void {
    window.print();
  }

  volver(): void {
    this.router.navigate(['/matricula/registrar']);
  }
}
