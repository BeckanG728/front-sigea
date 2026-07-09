import { Component, inject, signal, computed, effect, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { PermisoMap } from '../../../core/models/permiso.model';
import { ARBOL_PERMISOS, aplanarArbol, obtenerClavesGrupo, obtenerHojas, PERMISO_LABELS } from '../../../core/data/arbol-permisos';
import type { ItemPlano } from '../../../core/data/arbol-permisos';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [],
  templateUrl: './permisos.html',
  host: { style: 'flex: 1; min-height: 0; display: flex; flex-direction: column;' },
})
export class PermisosComponent implements AfterViewInit {
  data = inject(DataService);
  auth = inject(AuthService);
  private shellState = inject(ShellStateService);

  constructor() {
    this.shellState.title.set('Permisos');
    this.shellState.icon.set('bi bi-lock');
    effect(() => {
      this.selectedUserId();
      this.syncPermState();
    });
  }

  readonly PERMISO_LABELS = PERMISO_LABELS;
  readonly COLUMNAS = ['ver', 'crear', 'editar', 'eliminar', 'imprimir'] as const;

  selectedUserId = signal(3);
  expandedGrupos = signal<Set<string>>(new Set(obtenerClavesGrupo(ARBOL_PERMISOS)));
  expandedHojas = signal<Set<string>>(new Set(
    obtenerHojas(ARBOL_PERMISOS).filter(h => !h.readonly).map(h => h.key)
  ));
  applyMsg = signal('');
  permState = signal<Record<string, Record<string, boolean>>>({});

  @ViewChildren('parentCb', { read: ElementRef }) parentCbs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('leafCb', { read: ElementRef }) leafCbs!: QueryList<ElementRef<HTMLInputElement>>;

  selectedUser = computed(() => this.data.usuarios().find(u => u.id === this.selectedUserId()) ?? null);
  permisosRol = computed(() => {
    const u = this.selectedUser();
    return u ? (this.data.permisosPorRol()[u.rol] || {}) : {};
  });
  roleCss = computed(() => {
    const u = this.selectedUser();
    return u?.rol === 'superusuario' ? 'su' : u?.rol ?? '';
  });

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

  private syncPermState(): void {
    const perms = this.permisosRol();
    const state: Record<string, Record<string, boolean>> = {};
    for (const hoja of obtenerHojas(ARBOL_PERMISOS)) {
      if (hoja.readonly) continue;
      const leafPerm = perms[hoja.key] ?? {};
      state[hoja.key] = {};
      for (const p of hoja.permisosDisponibles ?? []) {
        state[hoja.key][p] = !!leafPerm[p];
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

  selectUser(id: number): void {
    this.selectedUserId.set(id);
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
    const u = this.selectedUser();
    if (!u) return;
    const nuevo: Record<string, PermisoMap> = {};
    for (const [leafKey, subs] of Object.entries(this.permState())) {
      const boolSubs: PermisoMap = {};
      let hasAny = false;
      for (const [subKey, checked] of Object.entries(subs)) {
        boolSubs[subKey] = checked;
        if (checked) hasAny = true;
      }
      if (hasAny) nuevo[leafKey] = boolSubs;
    }
    const perms = this.data.permisosPorRol();
    perms[u.rol] = nuevo;
    this.data.permisosPorRol.set({ ...perms });
    this.applyMsg.set('Permisos aplicados');
    setTimeout(() => this.applyMsg.set(''), 1200);
  }
}
