import { Component, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ConfirmDialogComponent as ConfirmModalComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { UsuariosService } from './usuarios.service';
import { PermisosService } from '../permisos/permisos.service';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { User } from '../../../core/models/user.model';
import { PermisoMap } from '../../../core/models/permiso.model';
import type { FuncionalidadNode } from '../../../core/models/funcionalidad.model';
import { RoleResponse } from '../../../core/models/role-api.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ModalComponent, ConfirmModalComponent],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private usuariosService = inject(UsuariosService);
  private permisosService = inject(PermisosService);
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
  roles = signal<RoleResponse[]>([]);

  tempModulePerms = signal<Record<string, boolean>>({});

  modulosDisponibles = computed(() => {
    const tree = this.auth.funcionalidades();
    if (!tree) return [];
    const result: { key: string; label: string }[] = [];
    for (const grupo of tree) {
      for (const hijo of grupo.hijos ?? []) {
        if (hijo.ruta) result.push({ key: hijo.codigo.toLowerCase(), label: hijo.nombre });
        for (const sub of hijo.hijos ?? []) {
          if (sub.ruta) result.push({ key: sub.codigo.toLowerCase(), label: sub.nombre });
        }
      }
    }
    return result;
  });

  constructor() {
    this.shellState.title.set('Panel superusuario');
    this.shellState.icon.set('bi bi-shield-check');
    effect(() => {
      this.selectedUserId();
      this.syncTempPerms();
    });
  }

  ngOnInit(): void {
    this.permisosService.listarRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => this.roles.set([]),
    });
    this.sub = this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        const mapped = usuarios.map(u => ({
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
        }));
        this.usuarios.set(mapped);
        this.data.usuarios.set(mapped);
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
    if (!u) return {};
    const tree = this.auth.funcionalidades();
    if (!tree) return {};
    const result: Record<string, boolean> = {};
    const buscar = (nodos: FuncionalidadNode[]) => {
      for (const n of nodos) {
        for (const h of n.hijos ?? []) {
          result[h.codigo.toLowerCase()] = h.permisos.ver;
          for (const sub of h.hijos ?? []) {
            result[sub.codigo.toLowerCase()] = sub.permisos.ver;
          }
        }
      }
    };
    buscar(tree);
    return result;
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
    const tree = this.auth.funcionalidades();
    if (tree) {
      for (const grupo of tree) {
        for (const hijo of grupo.hijos ?? []) {
          if (hijo.ruta) p[hijo.codigo.toLowerCase()] = !!perms[hijo.codigo.toLowerCase()];
          for (const sub of hijo.hijos ?? []) {
            if (sub.ruta) p[sub.codigo.toLowerCase()] = !!perms[sub.codigo.toLowerCase()];
          }
        }
      }
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
    const rolEncontrado = this.roles().find(r => r.nombre.toUpperCase() === rolKey.toUpperCase());
    if (!rolEncontrado) {
      this.nuevoError.set('Rol inválido.');
      return;
    }
    const idRol = rolEncontrado.idRol;
    this.usuariosService.crear({ nombre: nombre.trim(), apellido1: apellido1.trim(), dni: dni.trim(), password: 'Sigea@2026', idRol }).subscribe({
      next: (u) => {
        const nuevo = {
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
        };
        this.usuarios.update(list => [...list, nuevo]);
        this.data.usuarios.set(this.usuarios());
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
      target.rol = rol.toLowerCase();
    }
    this.usuarios.set([...usuarios]);
    this.data.usuarios.set([...usuarios]);
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
    this.data.usuarios.set(this.usuarios());
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
    this.loading.set(true);
    const rolId = this.roles().find(r => r.nombre.toUpperCase() === u.rol.toUpperCase())?.idRol;
    if (!rolId) {
      this.applyMsg.set('Error: rol no encontrado');
      setTimeout(() => this.applyMsg.set(''), 2000);
      this.loading.set(false);
      return;
    }
    const payload: { idFuncionalidad: number; codigo: string; ver: boolean; crear: boolean; editar: boolean; eliminar: boolean; imprimir: boolean }[] = [];
    for (const [codigo, checked] of Object.entries(this.tempModulePerms())) {
      payload.push({
        idFuncionalidad: 0,
        codigo: codigo.toUpperCase(),
        ver: checked,
        crear: checked,
        editar: checked,
        eliminar: checked,
        imprimir: checked,
      });
    }
    this.permisosService.guardarPermisos(rolId, { permisos: payload }).subscribe({
      next: () => {
        this.applyMsg.set('Permisos aplicados');
        setTimeout(() => this.applyMsg.set(''), 1200);
        this.loading.set(false);
      },
      error: () => {
        this.applyMsg.set('Error al guardar permisos');
        setTimeout(() => this.applyMsg.set(''), 2000);
        this.loading.set(false);
      },
    });
  }
}
