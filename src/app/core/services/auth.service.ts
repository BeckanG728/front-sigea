import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse,
  Verify2FARequest, Verify2FAResponse,
  ChangePasswordRequest, Enable2FARequest, Enable2FAResponse
} from '../models/auth.model';
import { DataService } from './data.service';
import { FuncionalidadNode, Permisos } from '../models/funcionalidad.model';
import { MenuEntry, SidebarGroup, SidebarLink, SidebarSubGroup } from '../models/menu.model';
import { getDevTreeForRole } from '../data/dev-funcionalidades';

export interface RoleInfo {
  key: string;
  routePrefix: string;
  label: string;
  initials: string;
  css: string;
  badgeLabel: string;
}

export const ROLES: { [key: string]: RoleInfo } = {
  superusuario: { key: 'superusuario', routePrefix: 'su', label: 'Superusuario', initials: 'SU', css: 'su', badgeLabel: 'acceso total' },
  director: { key: 'director', routePrefix: 'director', label: 'Director', initials: 'DI', css: 'director', badgeLabel: 'solo lectura' },
  secretaria: { key: 'secretaria', routePrefix: 'secretaria', label: 'Secretaria', initials: 'SE', css: 'secretaria', badgeLabel: 'operaciones' },
};

const API_BASE = environment.apiUrl;

const DEV_USERS = [
  { username: 'superusuario', password: 'admin123', roleKey: 'superusuario', displayName: 'Admin' },
  { username: 'director', password: 'director123', roleKey: 'director', displayName: 'Director' },
  { username: 'secretaria', password: 'secretaria123', roleKey: 'secretaria', displayName: 'Secretaria' },
];

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

  private pendingIdUsuario = 0;
  private pendingRolKey = '';

  constructor() {
    this.restoreSession();
  }

  login(usuario: string, password: string): Observable<LoginResponse> {
    if (environment.devMode) {
      const dev = DEV_USERS.find(u => u.username === usuario && u.password === password);
      if (dev) {
        const tree = getDevTreeForRole(dev.roleKey);
        const response: LoginResponse = {
          token: btoa(`${dev.username}:${Date.now()}`),
          idUsuario: 0,
          rol: dev.roleKey,
          requiere2FA: false,
          funcionalidades: tree ?? undefined,
        };
        return of(response).pipe(
          tap(res => this.saveSession(res.token!, res.rol, dev.displayName, res.funcionalidades))
        );
      }
    }
    const body: LoginRequest = { usuario, password };
    return this.http.post<LoginResponse>(`${API_BASE}/api/auth/login`, body).pipe(
      tap(res => {
        if (res.requiere2FA) {
          this.pendingIdUsuario = res.idUsuario;
          this.pendingRolKey = res.rol.toLowerCase();
          this.requires2FA.set(true);
        } else if (res.token) {
          this.saveSession(res.token, res.rol, usuario, res.funcionalidades);
        }
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
        this.saveSession(res.token, res.rol, this.usuario() ?? '', res.funcionalidades);
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
    this.role.set(null);
    this.usuario.set(null);
    this.isLoggedIn.set(false);
    this.funcionalidades.set(null);
    this.dosFactorActivo.set(false);
    this.secreto2FA.set(null);
    this.requires2FA.set(false);
    this.router.navigate(['/login']);
  }

  get homeRoute(): string {
    const r = this.role();
    if (!r) return '/login';
    const map: { [key: string]: string } = {
      superusuario: '/su/usuarios',
      director: '/director',
      secretaria: '/secretaria/matricula',
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

  private saveSession(token: string, rolDesdeApi: string, username: string, funcionalidades?: FuncionalidadNode[]): void {
    const roleKey = rolDesdeApi.toLowerCase();
    const role = ROLES[roleKey];
    if (!role) return;
    localStorage.setItem('token', token);
    localStorage.setItem('role', roleKey);
    localStorage.setItem('username', username);
    if (funcionalidades) {
      localStorage.setItem('funcionalidades', JSON.stringify(funcionalidades));
      this.funcionalidades.set(funcionalidades);
    } else {
      const fallback = getDevTreeForRole(roleKey);
      if (fallback) {
        localStorage.setItem('funcionalidades', JSON.stringify(fallback));
        this.funcionalidades.set(fallback);
      }
    }
    this.role.set(role);
    this.usuario.set(username);
    this.isLoggedIn.set(true);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const roleKey = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (roleKey && username && ROLES[roleKey]) {
      this.role.set(ROLES[roleKey]);
      this.usuario.set(username);
      this.isLoggedIn.set(true);
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
        .filter(h => h.permisos.ver)
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
