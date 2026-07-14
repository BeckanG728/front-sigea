import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MatriculaService, AnioAcademico, PreviewResponse, RegisterResponse } from './matricula.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Aula } from '../../core/services/data.service';
import { ConceptoResponse } from '../../core/services/concepto-api.service';
import { AulaApiService, AulaListado, Grado } from '../../core/services/aula-api.service';
import { AlumnoBusquedaResponse } from '../../core/services/alumno-api.service';

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
  readonly aulaApiService = inject(AulaApiService);

  readonly moneda = 'S/';

  constructor() {
    this.shellState.title.set('Matrícula');
    this.shellState.icon.set('bi-pencil-square');
    this.cargarDatosIniciales();
  }

  private async cargarDatosIniciales(): Promise<void> {
    await this.matriculaService.cargarAniosAcademicos();
    // this.matriculaService.cargarAlumnos(); // reemplazado por búsqueda de alumno por DNI

    try {
      const activo = await this.matriculaService.cargarAnioActivo();
      const found = this.aniosAcademicos().find(a => a.anio === activo.anio);
      if (found) {
        this.anioSeleccionado.set(found.id);
      }
    } catch {
      // si no hay año activo definido, se mantiene la preselección por defecto
    }

    this.cargarDatosPorAnio();
  }

  private cargarDatosPorAnio(): void {
    const anio = this.anioActual();
    if (anio) {
      this.matriculaService.cargarConceptos(anio.anio);
      this.matriculaService.cargarAulas(anio.id, anio.anio);
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
  alumnoID = signal(0);
  buscarAlumnoVisible = false;
  alumnoSeleccionado = signal<AlumnoBusquedaResponse | null>(null);

  dniInput = signal('');
  alumnoEncontrado = signal<AlumnoBusquedaResponse | null>(null);
  buscandoAlumno = signal(false);
  dniNoEncontrado = signal(false);

  abrirBuscarAlumno(): void {
    this.dniInput.set('');
    this.alumnoEncontrado.set(null);
    this.dniNoEncontrado.set(false);
    this.buscarAlumnoVisible = true;
  }

  onDniInput(value: string): void {
    this.dniInput.set(value);
    this.alumnoEncontrado.set(null);
    this.dniNoEncontrado.set(false);
  }

  async buscarAlumnoPorDni(): Promise<void> {
    this.buscandoAlumno.set(true);
    this.dniNoEncontrado.set(false);
    try {
      const alumno = await this.matriculaService.buscarAlumnoPorDni(this.dniInput());
      if (alumno) {
        this.alumnoEncontrado.set(alumno);
      } else {
        this.alumnoEncontrado.set(null);
        this.dniNoEncontrado.set(true);
      }
    } catch {
      this.alumnoEncontrado.set(null);
      this.dniNoEncontrado.set(true);
    } finally {
      this.buscandoAlumno.set(false);
    }
  }

  seleccionarAlumno(id: number): void {
    this.alumnoID.set(id);
    this.alumnoSeleccionado.set(this.alumnoEncontrado());
    this.dniInput.set('');
    this.alumnoEncontrado.set(null);
    this.buscarAlumnoVisible = false;
    this.erroresPreview.set([]);
    this.previewData.set(null);
    this.matriculaService.cargarDeudas(id);
  }

  // ─── Aula ───────────────────────────────────
  aulaId = signal(0);
  buscarAulaVisible = false;

  nivelSeleccionado = signal<number | null>(null);
  gradoSeleccionado = signal<number | null>(null);
  aulasResultado = signal<AulaListado[]>([]);
  buscandoAulas = signal(false);

  readonly gradosFiltrados = computed<Grado[]>(() =>
    this.aulaApiService.grados().filter(g => g.codNivel === this.nivelSeleccionado())
  );

  readonly aulasDisponibles = computed<Aula[]>(() =>
    this.matriculaService.aulas().filter(a =>
      a.estado === true && a.periodo === this.anioActual()?.anio
    )
  );

  get aulaActual(): Aula | undefined {
    return this.matriculaService.aulas().find(a => a.cod === this.aulaId());
  }

  abrirBuscarAula(): void {
    if (this.aulaApiService.niveles().length === 0) {
      this.aulaApiService.cargarNiveles();
    }
    if (this.aulaApiService.grados().length === 0) {
      this.aulaApiService.cargarGrados();
    }
    this.nivelSeleccionado.set(null);
    this.gradoSeleccionado.set(null);
    this.aulasResultado.set([]);
    this.buscarAulaVisible = true;
  }

  onNivelChange(id: number | null): void {
    this.nivelSeleccionado.set(id);
    this.gradoSeleccionado.set(null);
  }

  async buscarAulas(): Promise<void> {
    const anioActual = this.anioActual();
    if (!anioActual) { this.aulasResultado.set([]); return; }
    this.buscandoAulas.set(true);
    try {
      const res = await this.matriculaService.buscarAulas(
        anioActual.id,
        this.nivelSeleccionado() ?? undefined,
        this.gradoSeleccionado() ?? undefined
      );
      this.aulasResultado.set(res);
    } finally {
      this.buscandoAulas.set(false);
    }
  }

  seleccionarAula(cod: number): void {
    const aula = this.aulasResultado().find(a => a.id === cod);
    if (!aula) return;
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
    ).subscribe({
      next: res => {
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
      },
      error: () => {
        this.loadingPreview.set(false);
        this.erroresPreview.set(['Error al conectar con el servidor. Verifique su conexión e intente nuevamente.']);
      }
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
