import { Component, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ConfirmDialogComponent as ConfirmModalComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { UsuariosService } from './usuarios.service';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { User } from '../../../core/models/user.model';
import { PermisoMap } from '../../../core/models/permiso.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ModalComponent, ConfirmModalComponent],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private usuariosService = inject(UsuariosService);
  private shellState = inject(ShellStateService);
  private sub?: Subscription;

  data = inject(DataService);
  auth = inject(AuthService);

  usuarios = signal<User[]>([]);
  loading = signal(true);
  loadError = signal('');

  selectedUserId = signal(3);

  nuevoModalVisible = signal(false);
  editarModalVisible = signal(false);
  eliminarModalVisible = signal(false);
  editandoUsuario = signal<User | null>(null);
  eliminarUsuario = signal<User | null>(null);

  nuevoError = signal('');
  editError = signal('');
  applyMsg = signal('');

  private readonly ROL_ID: Record<string, number> = {
    director: 2,
    secretaria: 3,
  };

  tempModulePerms = signal<Record<string, boolean>>({});

  constructor() {
    this.shellState.title.set('Panel superusuario');
    this.shellState.icon.set('bi bi-shield-check');
    effect(() => {
      this.selectedUserId();
      this.syncTempPerms();
    });
  }

  ngOnInit(): void {
    this.sub = this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios.map(u => ({
          id: u.idUsuario,
          nombre: `${u.nombre} ${u.apellido1}`.trim() || u.usuario,
          username: u.usuario,
          doc: u.dni || '—',
          rol: u.nombreRol.toLowerCase(),
          estado: u.estado ? 'activo' : 'eliminado',
          noEliminable: u.nombreRol === 'SUPERUSUARIO',
          bloqueado: false,
          permisosVisibles: true,
          dosFactorActivo: u.dosFactorHabilitado,
          secreto2FA: null,
        })));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.loadError.set('Error al cargar usuarios');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectedUser = computed(() => this.usuarios().find(u => u.id === this.selectedUserId()) ?? null);
  permisosRol = computed(() => {
    const u = this.selectedUser();
    return u ? (this.data.permisosPorRol()[u.rol] || {}) : {};
  });
  isAdminSelected = computed(() => this.usuarios().some(u => u.noEliminable && u.id === this.selectedUserId()));

  eliminarMensaje = computed(() => {
    const u = this.eliminarUsuario();
    if (!u) return '';
    const accion = u.estado === 'activo' ? 'eliminar' : 'restaurar';
    return `¿Estás seguro de ${accion} a "${u.nombre}"?`;
  });
  eliminarAccion = computed(() => {
    const u = this.eliminarUsuario();
    return u?.estado === 'activo' ? 'Eliminar' : 'Restaurar';
  });
  eliminarVariant = computed(() => {
    const u = this.eliminarUsuario();
    return u?.estado === 'activo' ? 'danger' : 'dark';
  });

  private syncTempPerms(): void {
    const perms = this.permisosRol();
    const p: Record<string, boolean> = {};
    for (const m of this.data.modulos) {
      p[m.key] = !!perms[m.key];
    }
    this.tempModulePerms.set(p);
  }

  selectUser(id: number): void {
    this.selectedUserId.set(id);
  }

  toggleVisibility(id: number): void {
    const u = this.usuarios().find(x => x.id === id);
    if (u) {
      u.permisosVisibles = !u.permisosVisibles;
      this.usuarios.set([...this.usuarios()]);
    }
  }

  openNuevoModal(): void {
    this.nuevoError.set('');
    this.nuevoModalVisible.set(true);
  }

  submitNuevo(nombre: string, apellido1: string, dni: string, rolKey: string): void {
    if (!nombre.trim()) {
      this.nuevoError.set('El nombre es obligatorio.');
      return;
    }
    if (!apellido1.trim()) {
      this.nuevoError.set('El apellido es obligatorio.');
      return;
    }
    if (!/^\d{8}$/.test(dni.trim())) {
      this.nuevoError.set('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    const password = this.data.parametros().claveDefecto;
    const idRol = this.ROL_ID[rolKey];
    if (!idRol) {
      this.nuevoError.set('Rol inválido.');
      return;
    }
    this.usuariosService.crear({ nombre: nombre.trim(), apellido1: apellido1.trim(), dni: dni.trim(), password, idRol }).subscribe({
      next: (u) => {
        this.usuarios.update(list => [
          ...list,
          {
            id: u.idUsuario,
            nombre: `${u.nombre} ${u.apellido1}`.trim() || u.usuario,
            username: u.usuario,
            doc: u.dni,
            rol: u.nombreRol.toLowerCase(),
            estado: u.estado ? 'activo' : 'eliminado',
            noEliminable: u.nombreRol === 'SUPERUSUARIO',
            bloqueado: false,
            permisosVisibles: true,
            dosFactorActivo: u.dosFactorHabilitado,
            secreto2FA: null,
          },
        ]);
        this.selectedUserId.set(u.idUsuario);
        this.nuevoModalVisible.set(false);
        this.nuevoError.set('');
      },
      error: (err) => {
        this.nuevoError.set(err.error?.message || 'Error al crear usuario');
      },
    });
  }

  openEditarModal(u: User): void {
    this.editandoUsuario.set({ ...u });
    this.editError.set('');
    this.editarModalVisible.set(true);
  }

  submitEditar(nombre: string, doc: string, rol: string): void {
    const u = this.editandoUsuario();
    if (!u) return;
    if (!nombre.trim()) {
      this.editError.set('El nombre completo es obligatorio.');
      return;
    }
    const usuarios = this.usuarios();
    const target = usuarios.find(x => x.id === u.id);
    if (target) {
      target.nombre = nombre.trim();
      target.doc = doc.trim() || '—';
      target.rol = rol;
    }
    this.usuarios.set([...usuarios]);
    this.editarModalVisible.set(false);
  }

  confirmEliminar(u: User): void {
    this.eliminarUsuario.set(u);
    this.eliminarModalVisible.set(true);
  }

  ejecutarEliminar(): void {
    const u = this.eliminarUsuario();
    if (!u) return;
    u.estado = u.estado === 'activo' ? 'eliminado' : 'activo';
    this.usuarios.set([...this.usuarios()]);
    this.eliminarModalVisible.set(false);
    this.eliminarUsuario.set(null);
  }

  toggleModulePerm(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.tempModulePerms.update(p => ({ ...p, [key]: checked }));
  }

  applyPermisos(): void {
    const u = this.selectedUser();
    if (!u) return;
    const actual = this.permisosRol();
    const nuevo: Record<string, PermisoMap> = {};
    for (const [modKey, checked] of Object.entries(this.tempModulePerms())) {
      if (checked) {
        nuevo[modKey] = actual[modKey] || { ver: true, crear: true, editar: true, eliminar: true, imprimir: true };
      }
    }
    const perms = this.data.permisosPorRol();
    perms[u.rol] = nuevo;
    this.data.permisosPorRol.set({ ...perms });
    this.applyMsg.set('Permisos aplicados');
    setTimeout(() => this.applyMsg.set(''), 1200);
  }
}
