import { Component, inject, signal, computed, ViewChildren, QueryList, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { PermisoMap } from '../../../core/models/permiso.model';
import { ARBOL_PERMISOS, aplanarArbol, obtenerClavesGrupo, obtenerHojas, PERMISO_LABELS } from '../../../core/data/arbol-permisos';
import type { ItemPlano } from '../../../core/data/arbol-permisos';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PermisosService } from './permisos.service';
import type { PermisoPorFuncionalidad } from '../../../core/models/funcionalidad-api.model';

interface RoleOption {
  idRol: number;
  key: string;
  label: string;
  css: string;
  badgeLabel: string;
  initials: string;
}

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [ModalComponent, ConfirmDialogComponent],
  templateUrl: './permisos.html',
  host: { style: 'flex: 1; min-height: 0; display: flex; flex-direction: column;' },
})
export class PermisosComponent implements AfterViewInit, OnInit {
  data = inject(DataService);
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);
  private permisosService = inject(PermisosService);

  constructor() {
    this.shellState.title.set('Roles y permisos');
    this.shellState.icon.set('bi bi-lock');
  }

  ngOnInit(): void {
    this.cargarRoles();
  }

  readonly PERMISO_LABELS = PERMISO_LABELS;
  readonly COLUMNAS = ['ver', 'crear', 'editar', 'eliminar', 'imprimir'] as const;

  roles = signal<RoleOption[]>([]);
  selectedRoleId = signal<number>(0);
  expandedGrupos = signal<Set<string>>(new Set(obtenerClavesGrupo(ARBOL_PERMISOS)));
  expandedHojas = signal<Set<string>>(new Set(
    obtenerHojas(ARBOL_PERMISOS).filter(h => !h.readonly).map(h => h.key)
  ));
  applyMsg = signal('');
  nuevoRolModalVisible = signal(false);
  nuevoRolError = signal('');
  loading = signal(false);
  permState = signal<Record<string, Record<string, boolean>>>({});
  confirmModalVisible = signal(false);
  pendingDeleteRoleId = signal<number | null>(null);

  @ViewChildren('parentCb', { read: ElementRef }) parentCbs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('leafCb', { read: ElementRef }) leafCbs!: QueryList<ElementRef<HTMLInputElement>>;

  selectedRole = computed(() => this.roles().find(r => r.idRol === this.selectedRoleId()) ?? null);

  private readonly PALETA_ROLES: Record<string, { bg: string; border: string }> = {
    superusuario: { bg: '#efe7fc', border: '#7c3aed' },
    secretaria:  { bg: '#fef0e1', border: '#f97316' },
    director:    { bg: '#e2f6ea', border: '#0f9d58' },
  };

  private readonly PALETA_DINAMICA = [
    { bg: '#e8f0fe', border: '#4285f4' },
  ];

  selectedRoleCss = computed(() => this.selectedRole()?.key ?? '');

  getRoleStyle(role: RoleOption): Record<string, string> {
    const especifico = this.PALETA_ROLES[role.key];
    if (especifico) {
      return { 'background-color': especifico.bg, 'border': `1px solid ${especifico.border}` };
    }
    const pal = this.PALETA_DINAMICA[(role.idRol - 1) % this.PALETA_DINAMICA.length];
    return { 'background-color': pal.bg, 'border': `1px solid ${pal.border}` };
  }

  arbolPlano = computed(() => {
    const expanded = this.expandedGrupos();
    const expandedLeaves = this.expandedHojas();
    const all = aplanarArbol(ARBOL_PERMISOS);
    const result: ItemPlano[] = [];
    const collapseStack: number[] = [];
    const skipLeafKeys = new Set<string>();
    for (const item of all) {
      if (collapseStack.some(d => item.depth > d)) continue;
      while (collapseStack.length && collapseStack[collapseStack.length - 1] >= item.depth) {
        collapseStack.pop();
      }
      if (item.tipo === 'grupo' || item.tipo === 'subgrupo') {
        result.push(item);
        if (!expanded.has(item.key)) collapseStack.push(item.depth);
      } else if (item.tipo === 'hoja') {
        result.push(item);
        if (!expandedLeaves.has(item.key)) skipLeafKeys.add(item.key);
        else skipLeafKeys.delete(item.key);
      } else if (item.tipo === 'permiso') {
        if (skipLeafKeys.has(item.parentKey)) continue;
        result.push(item);
      }
    }
    return result;
  });

  hojasPorParent = computed(() => {
    const map = new Map<string, string[]>();
    for (const item of aplanarArbol(ARBOL_PERMISOS)) {
      if (item.tipo === 'hoja' && item.key !== 'mi-cuenta') {
        const pk = (item as ItemPlano & { parentKey: string }).parentKey;
        if (!map.has(pk)) map.set(pk, []);
        map.get(pk)!.push(item.key);
      }
    }
    return map;
  });

  ngAfterViewInit(): void {
    this.updateIndeterminate();
  }

  private cargarRoles(): void {
    this.loading.set(true);
    this.permisosService.listarRoles().subscribe({
      next: (rolesApi) => {
        const mapped: RoleOption[] = rolesApi.map(r => {
          const lowerKey = r.nombre.toLowerCase();
          return {
            idRol: r.idRol,
            key: lowerKey,
            label: r.nombre,
            css: lowerKey,
            badgeLabel: lowerKey,
            initials: r.nombre.substring(0, 2),
          };
        });
        this.roles.set(mapped);
        if (mapped.length > 0) {
          this.selectedRoleId.set(mapped[0].idRol);
          this.cargarPermisos(mapped[0].idRol);
        }
        this.loading.set(false);
      },
      error: () => {
        this.roles.set([]);
        this.loading.set(false);
      },
    });
  }

  private cargarPermisos(idRol: number): void {
    this.loading.set(true);
    this.permisosService.obtenerPermisos(idRol).subscribe({
      next: (permisos) => {
        this.aplicarPermisosBackend(permisos);
        this.loading.set(false);
      },
      error: () => {
        this.syncPermStateFromLocal();
        this.loading.set(false);
      },
    });
  }

  private aplicarPermisosBackend(permisos: PermisoPorFuncionalidad[]): void {
    const permMap: Record<string, PermisoPorFuncionalidad> = {};
    for (const p of permisos) {
      permMap[p.codigo] = p;
    }
    const state: Record<string, Record<string, boolean>> = {};
    for (const hoja of obtenerHojas(ARBOL_PERMISOS)) {
      if (hoja.readonly) continue;
      const leafKey = hoja.key;
      const backendCode = hoja.codigoBackend;
      state[leafKey] = {};
      if (backendCode && permMap[backendCode]) {
        const bp = permMap[backendCode];
        for (const p of hoja.permisosDisponibles ?? []) {
          state[leafKey][p] = !!(bp as any)[p];
        }
      } else {
        for (const p of hoja.permisosDisponibles ?? []) {
          state[leafKey][p] = false;
        }
      }
    }
    this.permState.set(state);
    setTimeout(() => this.updateIndeterminate());
  }

  private syncPermStateFromLocal(): void {
    const state: Record<string, Record<string, boolean>> = {};
    for (const hoja of obtenerHojas(ARBOL_PERMISOS)) {
      if (hoja.readonly) continue;
      state[hoja.key] = {};
      for (const p of hoja.permisosDisponibles ?? []) {
        state[hoja.key][p] = false;
      }
    }
    this.permState.set(state);
    setTimeout(() => this.updateIndeterminate());
  }

  private updateIndeterminate(): void {
    if (this.parentCbs) {
      for (const cbRef of this.parentCbs.toArray()) {
        const el = cbRef.nativeElement;
        const pk = el.dataset['parentKey'];
        if (!pk) continue;
        el.indeterminate = this.isSomeChecked(pk) && !this.isAllChecked(pk);
      }
    }
    if (this.leafCbs) {
      for (const cbRef of this.leafCbs.toArray()) {
        const el = cbRef.nativeElement;
        const lk = el.dataset['leafKey'];
        if (!lk) continue;
        el.indeterminate = this.isLeafSomeChecked(lk);
      }
    }
  }

  isAllChecked(parentKey: string): boolean {
    const leafKeys = this.hojasPorParent().get(parentKey);
    if (!leafKeys || leafKeys.length === 0) return false;
    return leafKeys.every(k => {
      const subs = this.permState()[k];
      return subs && Object.values(subs).every(Boolean);
    });
  }

  isSomeChecked(parentKey: string): boolean {
    const leafKeys = this.hojasPorParent().get(parentKey);
    if (!leafKeys || leafKeys.length === 0) return false;
    return leafKeys.some(k => {
      const subs = this.permState()[k];
      return subs && Object.values(subs).some(Boolean);
    });
  }

  isLeafAllChecked(leafKey: string): boolean {
    const subs = this.permState()[leafKey];
    return !!subs && Object.keys(subs).length > 0 && Object.values(subs).every(Boolean);
  }

  isLeafSomeChecked(leafKey: string): boolean {
    const subs = this.permState()[leafKey];
    return !!subs && Object.values(subs).some(Boolean) && !Object.values(subs).every(Boolean);
  }

  selectRole(idRol: number): void {
    this.selectedRoleId.set(idRol);
    this.cargarPermisos(idRol);
  }

  toggleGrupo(key: string): void {
    this.expandedGrupos.update(s => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  toggleHoja(key: string): void {
    this.expandedHojas.update(s => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  expandAll(): void {
    this.expandedGrupos.set(new Set(obtenerClavesGrupo(ARBOL_PERMISOS)));
    this.expandedHojas.set(new Set(
      obtenerHojas(ARBOL_PERMISOS).filter(h => !h.readonly).map(h => h.key)
    ));
  }

  collapseAll(): void {
    this.expandedGrupos.set(new Set());
    this.expandedHojas.set(new Set());
  }

  onParentChange(parentKey: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const leafKeys = this.hojasPorParent().get(parentKey) ?? [];
    this.permState.update(state => {
      const next = { ...state };
      for (const lk of leafKeys) {
        const subs = next[lk];
        if (subs) {
          const updated: Record<string, boolean> = {};
          for (const k of Object.keys(subs)) updated[k] = checked;
          next[lk] = updated;
        }
      }
      return next;
    });
    setTimeout(() => this.updateIndeterminate());
  }

  onLeafChange(leafKey: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.permState.update(state => {
      const subs = state[leafKey];
      if (!subs) return state;
      const updated: Record<string, boolean> = {};
      for (const k of Object.keys(subs)) updated[k] = checked;
      return { ...state, [leafKey]: updated };
    });
    setTimeout(() => this.updateIndeterminate());
  }

  onChildChange(leafKey: string, permKey: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.permState.update(state => ({
      ...state,
      [leafKey]: { ...state[leafKey], [permKey]: checked }
    }));
    setTimeout(() => this.updateIndeterminate());
  }

  applyPermisos(): void {
    const role = this.selectedRole();
    if (!role) return;
    this.loading.set(true);
    const payload: PermisoPorFuncionalidad[] = [];
    for (const hoja of obtenerHojas(ARBOL_PERMISOS)) {
      if (hoja.readonly || !hoja.codigoBackend) continue;
      const subs = this.permState()[hoja.key];
      if (!subs) continue;
      payload.push({
        idFuncionalidad: 0,
        codigo: hoja.codigoBackend,
        ver: subs['ver'] ?? false,
        crear: subs['crear'] ?? false,
        editar: subs['editar'] ?? false,
        eliminar: subs['eliminar'] ?? false,
        imprimir: subs['imprimir'] ?? false,
      });
    }
    this.permisosService.guardarPermisos(role.idRol, { permisos: payload }).subscribe({
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

  openNuevoRolModal(): void {
    this.nuevoRolError.set('');
    this.nuevoRolModalVisible.set(true);
  }

  submitNuevoRol(name: string): void {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) {
      this.nuevoRolError.set('El nombre del rol es obligatorio.');
      return;
    }
    if (trimmed.includes(' ')) {
      this.nuevoRolError.set('El nombre no debe contener espacios.');
      return;
    }
    const key = trimmed.toLowerCase();
    if (this.roles().some(r => r.key === key)) {
      this.nuevoRolError.set('Ya existe un rol con ese nombre.');
      return;
    }
    this.loading.set(true);
    this.permisosService.crearRol({ nombre: trimmed }).subscribe({
      next: (created) => {
        const newRole: RoleOption = {
          idRol: created.idRol,
          key,
          label: trimmed,
          css: key,
          badgeLabel: key,
          initials: trimmed.substring(0, 2),
        };
        this.roles.update(list => [...list, newRole]);
        this.selectedRoleId.set(created.idRol);
        this.syncPermStateFromLocal();
        this.nuevoRolModalVisible.set(false);
        this.nuevoRolError.set('');
        this.loading.set(false);
      },
      error: () => {
        this.nuevoRolError.set('Error al crear el rol en el servidor.');
        this.loading.set(false);
      },
    });
  }

  eliminarRol(idRol: number): void {
    const role = this.roles().find(r => r.idRol === idRol);
    if (!role) return;
    if (role.key === 'superusuario') {
      alert('No se puede eliminar el rol Superusuario.');
      return;
    }
    const count = this.data.usuarios().filter(u => u.rol === role.key).length;
    if (count > 0) {
      alert(`No se puede eliminar "${role.label}" porque tiene ${count} usuario(s) asignado(s).`);
      return;
    }
    this.pendingDeleteRoleId.set(idRol);
    this.confirmModalVisible.set(true);
  }

  pendingDeleteRole = computed(() => {
    const id = this.pendingDeleteRoleId();
    if (!id) return null;
    return this.roles().find(r => r.idRol === id) ?? null;
  });

  cancelarEliminar(): void {
    this.confirmModalVisible.set(false);
    this.pendingDeleteRoleId.set(null);
  }

  ejecutarEliminar(): void {
    const idRol = this.pendingDeleteRoleId();
    if (!idRol) return;
    this.confirmModalVisible.set(false);
    this.pendingDeleteRoleId.set(null);
    this.loading.set(true);
    this.permisosService.eliminarRol(idRol).subscribe({
      next: () => {
        this.roles.update(list => list.filter(r => r.idRol !== idRol));
        if (this.selectedRoleId() === idRol) {
          const remaining = this.roles();
          if (remaining.length > 0) {
            this.selectedRoleId.set(remaining[0].idRol);
            this.cargarPermisos(remaining[0].idRol);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        alert('No se pudo eliminar el rol. Verifique que no tenga usuarios asignados.');
        this.loading.set(false);
      },
    });
  }
}
