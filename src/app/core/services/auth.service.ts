import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse,
  Verify2FARequest, Verify2FAResponse,
  ChangePasswordRequest, Enable2FARequest, Enable2FAResponse
} from '../models/auth.model';
import { ROLE_KEY_MAP } from '../models/role.model';
import { DataService } from './data.service';
import { FuncionalidadNode, Permisos } from '../models/funcionalidad.model';
import { MenuEntry, SidebarGroup, SidebarLink, SidebarSubGroup } from '../models/menu.model';
import { getDevTreeForRole } from '../data/dev-funcionalidades';
import { CATALOGO_MENU } from '../data/catalogo-menu';

export interface RoleInfo {
  key: string;
  routePrefix: string;
  label: string;
  initials: string;
  css: string;
  badgeLabel: string;
}

export const ROLES_LOCAL: { [key: string]: RoleInfo } = {
  superusuario: { key: 'superusuario', routePrefix: 'su', label: 'Superusuario', initials: 'SU', css: 'su', badgeLabel: 'acceso total' },
  director: { key: 'director', routePrefix: 'director', label: 'Director', initials: 'DI', css: 'director', badgeLabel: 'solo lectura' },
  secretaria: { key: 'secretaria', routePrefix: 'secretaria', label: 'Secretaria', initials: 'SE', css: 'secretaria', badgeLabel: 'operaciones' },
};

const API_BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private dataService = inject(DataService);

  readonly role = signal<RoleInfo | null>(null);
  readonly usuario = signal<string | null>(null);
  readonly isLoggedIn = signal(false);
  readonly dosFactorActivo = signal(false);
  readonly secreto2FA = signal<string | null>(null);
  readonly requires2FA = signal(false);
  readonly funcionalidades = signal<FuncionalidadNode[] | null>(null);
  readonly idUsuario = signal<number>(0);
  readonly idRol = signal<number>(0);

  private pendingIdUsuario = 0;
  private pendingRolKey = '';

  constructor() {
    this.restoreSession();
  }

  login(usuario: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email: usuario, password };
    return this.http.post<LoginResponse>(`${API_BASE}/api/auth/login`, body).pipe(
      tap(res => {
        if (res.login2fa) {
          this.pendingIdUsuario = res.idUsuario;
          this.pendingRolKey = ROLE_KEY_MAP[res.nombreRol] ?? '';
          this.requires2FA.set(true);
        } else {
          localStorage.setItem('token', res.token);
        }
      }),
      switchMap(res => {
        if (res.login2fa) return of(res);

        const roleKey = ROLE_KEY_MAP[res.nombreRol] ?? '';
        const roleInfo = ROLES_LOCAL[roleKey];
        if (!roleInfo) return of(res);

        localStorage.setItem('role', roleKey);
        localStorage.setItem('username', res.nombreCompleto);
        localStorage.setItem('idUsuario', String(res.idUsuario));
        localStorage.setItem('idRol', String(res.idRol));
        this.role.set(roleInfo);
        this.usuario.set(res.nombreCompleto);
        this.idUsuario.set(res.idUsuario);
        this.idRol.set(res.idRol);

        return this.fetchPermisos().pipe(map(() => res));
      })
    );
  }

  verify2FA(codigoTotp: string): Observable<Verify2FAResponse> {
    const body: Verify2FARequest = {
      idUsuario: this.pendingIdUsuario,
      codigoTotp
    };
    return this.http.post<Verify2FAResponse>(`${API_BASE}/api/auth/login/verify-2fa`, body).pipe(
      tap(res => {
        this.requires2FA.set(false);
        localStorage.setItem('token', res.token);
      }),
      switchMap(res => {
        const roleInfo = ROLES_LOCAL[this.pendingRolKey];
        if (!roleInfo) return of(res);

        localStorage.setItem('role', this.pendingRolKey);
        this.role.set(roleInfo);

        return this.fetchPermisos().pipe(map(() => res));
      })
    );
  }

  getPendingIdUsuario(): number {
    return this.pendingIdUsuario;
  }

  getPendingRolKey(): string {
    return this.pendingRolKey;
  }

  changePassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
    const body: ChangePasswordRequest = { passwordActual, passwordNueva };
    return this.http.put<{ message: string }>(`${API_BASE}/api/auth/change-password`, body);
  }

  enable2FA(password: string): Observable<Enable2FAResponse> {
    if (environment.devMode) {
      const mockSecret = 'otpauth://totp/Sigea:' + this.usuario() + '?secret=DEVFAKE1234567890&issuer=Sigea';
      const response: Enable2FAResponse = { secretoQr: mockSecret, dosFactorHabilitado: true };
      return of(response).pipe(
        tap(res => {
          this.dosFactorActivo.set(res.dosFactorHabilitado);
          this.secreto2FA.set(res.secretoQr);
        })
      );
    }
    const body: Enable2FARequest = { password };
    return this.http.post<Enable2FAResponse>(`${API_BASE}/api/auth/2fa/enable`, body).pipe(
      tap(res => {
        this.dosFactorActivo.set(res.dosFactorHabilitado);
        this.secreto2FA.set(res.secretoQr);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('funcionalidades');
    localStorage.removeItem('idUsuario');
    localStorage.removeItem('idRol');
    this.role.set(null);
    this.usuario.set(null);
    this.isLoggedIn.set(false);
    this.funcionalidades.set(null);
    this.dosFactorActivo.set(false);
    this.secreto2FA.set(null);
    this.requires2FA.set(false);
    this.idUsuario.set(0);
    this.idRol.set(0);
    this.router.navigate(['/login']);
  }

  get homeRoute(): string {
    const r = this.role();
    if (!r) return '/login';
    // Apunta al contenedor "en blanco" del rol (ver PanelInicioComponent), no a una
    // vista funcional puntual. Si se apuntara directo a una vista (p. ej. /secretaria/alumnos)
    // y esa vista no tuviera el permiso asignado, el funcionalidadGuard la rechazaría justo
    // tras el login y el usuario quedaría sin ver nada. La ruta home nunca tiene
    // funcionalidadGuard, así que el login siempre "resuelve" a algo visible, y el usuario
    // navega desde el menú lateral (que ya filtra por permisos reales).
    const map: { [key: string]: string } = {
      superusuario: '/su',
      director: '/director',
      secretaria: '/secretaria',
    };
    return map[r.key] || '/login';
  }

  // ─── Funcionalidades tree ────────────────────────────────────────

  getMenuEntries(): MenuEntry[] {
    const tree = this.funcionalidades();
    if (tree) {
      return tree
        .filter(m => m.permisos.ver)
        .map(m => this.nodeToGroup(m));
    }
    return this.getFallbackMenu();
  }

  tieneFuncionalidad(ruta: string): boolean {
    const tree = this.funcionalidades();
    if (!tree) return true;
    return this.buscarRuta(tree, ruta);
  }

  tienePermiso(nombre: string, permiso: keyof Permisos): boolean {
    const tree = this.funcionalidades();
    if (!tree) return true;
    return this.buscarPermiso(tree, nombre, permiso);
  }

  // ─── Private ─────────────────────────────────────────────────────

  private fetchPermisos(): Observable<FuncionalidadNode[]> {
    const routePrefix = this.role()?.routePrefix ?? '';
    return this.http.get<{ permisos: any[] }>(`${API_BASE}/api/funcionalidades`).pipe(
      tap(response => {
        const enriched = this.enrichTree(response.permisos, routePrefix);
        console.log(enriched)
        this.persistSession(enriched);
      }),
      map(response => this.enrichTree(response.permisos, routePrefix))
    );
  }

  private enrichTree(nodes: any[], routePrefix: string): FuncionalidadNode[] {
    return nodes.map(n => {
      const entry = CATALOGO_MENU[n.codigo];
      let ruta: string | undefined;
      let icon = 'bi bi-circle';
      if (entry) {
        if (entry.ruta) {
          ruta = entry.ruta.startsWith('/')
            ? entry.ruta
            : `/${entry.ruta.replace(':prefix', routePrefix)}`;
        }
        icon = entry.icono;
      }
      const hijos = n.hijos && n.hijos.length > 0
        ? this.enrichTree(n.hijos, routePrefix)
        : [];

      const node: FuncionalidadNode = {
        idFuncionalidad: n.idFuncionalidad,
        codigo: n.codigo,
        nombre: n.nombre,
        permisos: n.permisos,
        icon,
        hijos,
      };
      if (ruta) node.ruta = ruta;
      return node;
    });
  }

  private persistSession(arbol: FuncionalidadNode[]): void {
    localStorage.setItem('funcionalidades', JSON.stringify(arbol));
    this.funcionalidades.set(arbol);
    this.isLoggedIn.set(true);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const roleKey = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (roleKey && username && ROLES_LOCAL[roleKey]) {
      this.role.set(ROLES_LOCAL[roleKey]);
      this.usuario.set(username);
      this.isLoggedIn.set(true);
      const idUsr = localStorage.getItem('idUsuario');
      const idRl = localStorage.getItem('idRol');
      if (idUsr) this.idUsuario.set(Number(idUsr));
      if (idRl) this.idRol.set(Number(idRl));
      const raw = localStorage.getItem('funcionalidades');
      if (raw) {
        try {
          this.funcionalidades.set(JSON.parse(raw));
        } catch {
          const fallback = getDevTreeForRole(roleKey);
          if (fallback) this.funcionalidades.set(fallback);
        }
      } else {
        const fallback = getDevTreeForRole(roleKey);
        if (fallback) this.funcionalidades.set(fallback);
      }
    }
  }

  private nodeToGroup(node: FuncionalidadNode): SidebarGroup {
    return {
      type: 'group',
      group: node.nombre,
      dataGroup: node.nombre.toLowerCase().replace(/\s+/g, '-'),
      icon: node.icon,
      children: (node.hijos ?? [])
        .filter(h => h.permisos.ver && h.ruta)
        .map(h => {
          if (h.hijos && h.hijos.length > 0) {
            return {
              type: 'subgroup' as const,
              group: h.nombre,
              dataGroup: h.nombre.toLowerCase().replace(/\s+/g, '-'),
              icon: h.icon,
              children: h.hijos
                .filter(sh => sh.permisos.ver && sh.ruta)
                .map(sh => ({
                  icon: sh.icon,
                  label: sh.nombre,
                  route: sh.ruta!,
                })),
            } satisfies SidebarSubGroup;
          }
          return {
            icon: h.icon,
            label: h.nombre,
            route: h.ruta!,
          } satisfies SidebarLink;
        }),
    };
  }

  private buscarRuta(nodes: FuncionalidadNode[], ruta: string): boolean {
    for (const n of nodes) {
      if (n.ruta === ruta && n.permisos.ver) return true;
      if (n.hijos) {
        const found = this.buscarRuta(n.hijos, ruta);
        if (found) return found;
      }
    }
    return false;
  }

  private buscarPermiso(nodes: FuncionalidadNode[], nombre: string, permiso: keyof Permisos): boolean {
    for (const n of nodes) {
      if (n.nombre === nombre) return n.permisos[permiso];
      if (n.hijos) {
        const found = this.buscarPermiso(n.hijos, nombre, permiso);
        if (found) return found;
      }
    }
    return false;
  }

  private getFallbackMenu(): MenuEntry[] {
    const roleKey = this.role()?.key;
    return getDevTreeForRole(roleKey)?.map(m => this.nodeToGroup(m)) ?? [];
  }
}
