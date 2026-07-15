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
import { version } from 'xlsx';

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

  permisosRol = signal<Record<string, boolean>>({});
  selectedUserId = signal(3);

  usuarioModalVisible = signal(false);
  modoUsuario = signal<'crear' | 'editar'>('crear');
  eliminarModalVisible = signal(false);
  editandoUsuario = signal<User | null>(null);
  eliminarUsuario = signal<User | null>(null);

  usuarioError = signal('');
  applyMsg = signal('');
  usuarioModalTitulo = computed(() => this.modoUsuario() === 'crear' ? 'Nuevo usuario' : 'Editar usuario');
  rolesSeleccionables = computed(() => this.roles().filter(r => r.nombre.toUpperCase() !== 'SUPERUSUARIO'));
  roles = signal<RoleResponse[]>([]);

  paginaActual = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);
  pageSize = signal(20);

  hayPaginaAnterior = computed(() => this.paginaActual() > 0);
  hayPaginaSiguiente = computed(() => this.paginaActual() < this.totalPaginas() - 1);

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
  }

  ngOnInit(): void {
    this.permisosService.listarRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => this.roles.set([]),
    });
    this.cargarPagina(0);
  }

  private cargarPagina(page: number): void {
    this.loading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.usuariosService.listar(page, this.pageSize()).subscribe({
      next: (res) => {
        const mapped = res.content.map(u => ({
          id: u.idUsuario,
          nombre: `${u.nombre} ${u.primerApellido}`.trim(),
          nombreSolo: u.nombre,
          apellido: u.primerApellido,
          doc: u.numeroDocumento || '—',
          rol: u.nombreRol.toLowerCase(),
          estado: u.estado ? 'activo' : 'inactivo',
          version: u.version,
          noEliminable: u.nombreRol === 'SUPERUSUARIO',
          bloqueado: false,
          permisosVisibles: true,
          secreto2FA: null,
        }));
        this.usuarios.set(mapped);
        this.data.usuarios.set(mapped);
        this.paginaActual.set(res.pageNumber);
        this.totalPaginas.set(res.totalPages);
        this.totalElementos.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Error al cargar usuarios');
        this.loading.set(false);
      }
    });
  }

  paginaSiguiente(): void {
    if (this.hayPaginaSiguiente()) this.cargarPagina(this.paginaActual() + 1);
  }

  paginaAnterior(): void {
    if (this.hayPaginaAnterior()) this.cargarPagina(this.paginaActual() - 1);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectedUser = computed(() => this.usuarios().find(u => u.id === this.selectedUserId()) ?? null);
  permisosUsuario = computed(() => {
    const tree = this.auth.funcionalidades();
    if (!tree) return {};

    const result: Record<string, boolean> = {};

    const buscar = (nodos: FuncionalidadNode[]) => {
      for (const nodo of nodos) {
        for (const hijo of nodo.hijos ?? []) {

          result[hijo.codigo.toLowerCase()] = hijo.permisos.ver;

          for (const sub of hijo.hijos ?? []) {
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

  selectUser(id: number): void {
  this.selectedUserId.set(id);

  const usuario = this.usuarios().find(u => u.id === id);
  if (!usuario) return;

  const rol = this.roles().find(
    r => r.nombre.toUpperCase() === usuario.rol.toUpperCase()
  );

  if (!rol) {
    this.permisosRol.set({});
    return;
  }

  this.permisosService.obtenerPermisos(rol.idRol).subscribe({
    next: permisos => {

      const map: Record<string, boolean> = {};

      for (const p of permisos) {
        map[p.codigo.toLowerCase()] = p.ver;
      }

      this.permisosRol.set(map);
    },
    error: () => this.permisosRol.set({})
  });
}

  toggleVisibility(id: number): void {
    const u = this.usuarios().find(x => x.id === id);
    if (u) {
      u.permisosVisibles = !u.permisosVisibles;
      this.usuarios.set([...this.usuarios()]);
    }
  }

  openNuevoModal(): void {
    this.modoUsuario.set('crear');
    this.editandoUsuario.set(null);
    this.usuarioError.set('');
    this.usuarioModalVisible.set(true);
  }

  openEditarModal(u: User): void {
    this.modoUsuario.set('editar');
    this.editandoUsuario.set({ ...u });
    this.usuarioError.set('');
    this.usuarioModalVisible.set(true);
  }

  submitUsuario(nombre: string, apellido: string, numeroDocumento: string, rolKey: string): void {
    if (!nombre.trim()) {
      this.usuarioError.set('El nombre es obligatorio.');
      return;
    }
    if (!apellido.trim()) {
      this.usuarioError.set('El apellido es obligatorio.');
      return;
    }
    if (!numeroDocumento.trim()) {
      this.usuarioError.set('El número de documento es obligatorio.');
      return;
    }
    const rolEncontrado = this.rolesSeleccionables().find(r => r.nombre.toUpperCase() === rolKey.toUpperCase());
    if (!rolEncontrado) {
      this.usuarioError.set('Rol inválido.');
      return;
    }
    const payload = {
      nombre: nombre.trim(),
      primerApellido: apellido.trim(),
      numeroDocumento: numeroDocumento.trim(),
      idRol: rolEncontrado.idRol
    };

    if (this.modoUsuario() === 'crear') {
      this.usuariosService.crear(payload).subscribe({
        next: (res) => {
          this.cargarPagina(this.paginaActual());
          this.selectedUserId.set(res.id ?? 0);
          this.usuarioModalVisible.set(false);
          this.usuarioError.set('');
        },
        error: (err) => {
          this.usuarioError.set(err.error?.message || 'Error al crear usuario');
        },
      });
    } else {
      const u = this.editandoUsuario();
      if (!u) return;
      this.usuariosService.actualizar(u.id, { ...payload, version: u.version }).subscribe({
        next: () => {
          this.cargarPagina(this.paginaActual());
          this.usuarioModalVisible.set(false);
          this.usuarioError.set('');
        },
        error: (err) => {
          this.usuarioError.set(err.error?.message || 'Error al actualizar usuario');
        },
      });
    }
  }

  confirmEliminar(u: User): void {
    this.eliminarUsuario.set(u);
    this.eliminarModalVisible.set(true);
  }

  ejecutarEliminar(): void {
    const u = this.eliminarUsuario();
    if (!u) return;
    this.usuariosService.eliminar(u.id).subscribe({
      next: () => {
        this.cargarPagina(this.paginaActual());
        this.eliminarModalVisible.set(false);
        this.eliminarUsuario.set(null);
      },
      error: () => {
        this.eliminarModalVisible.set(false);
        this.eliminarUsuario.set(null);
      },
    });
  }
}
