import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse,
  Verify2FARequest, Verify2FAResponse,
  ChangePasswordRequest, Enable2FARequest, Enable2FAResponse,
  QrTotpResponse
} from '../models/auth.model';
import { ROLE_KEY_MAP, RoleInfo, ROLES } from '../models/role.model';
import { DataService } from './data.service';
import { FuncionalidadNode, Permisos } from '../models/funcionalidad.model';
import { MenuEntry, SidebarGroup, SidebarLink, SidebarSubGroup } from '../models/menu.model';
import { CATALOGO_MENU } from '../data/catalogo-menu';


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
        const roleInfo = ROLES[roleKey];
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
        const roleInfo = ROLES[this.pendingRolKey];
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

  obtenerQrTotp(): Observable<QrTotpResponse> {
    if (environment.devMode) {
      const mockUri = 'otpauth://totp/Sigea:' + this.usuario() + '?secret=DEVFAKE1234567890&issuer=Sigea';
      return of({ qrUri: mockUri });
    }
    return this.http.get<QrTotpResponse>(`${API_BASE}/api/auth/2fa/qr`);
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
    return '/';
  }
  
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

  tieneCodigoFuncionalidad(codigo: string): boolean {
    const tree = this.funcionalidades();

    if (!tree) return false;

    return this.buscarCodigo(tree, codigo);
  }

  private buscarCodigo(
    nodes: FuncionalidadNode[],
    codigo: string
  ): boolean {

    for (const node of nodes) {

      if (
        node.codigo === codigo &&
        node.permisos.ver
      ) {
        return true;
      }

      if (node.hijos?.length) {
        if (this.buscarCodigo(node.hijos, codigo)) {
          return true;
        }
      }
    }

    return false;
  }

  tienePermiso(nombre: string, permiso: keyof Permisos): boolean {
    const tree = this.funcionalidades();
    if (!tree) return true;
    return this.buscarPermiso(tree, nombre, permiso);
  }

  // ─── Private ─────────────────────────────────────────────────────

  private fetchPermisos(): Observable<FuncionalidadNode[]> {
    return this.http.get<{ permisos: any[] }>(`${API_BASE}/api/funcionalidades`).pipe(
      tap(response => {
        const enriched = this.enrichTree(response.permisos);
        console.log(enriched)
        this.persistSession(enriched);
      }),
      map(response => this.enrichTree(response.permisos))
    );
  }

  private enrichTree(nodes: any[]): FuncionalidadNode[] {
    return nodes.map(n => {
      const entry = CATALOGO_MENU[n.codigo];
      let ruta: string | undefined;
      let icon = 'bi bi-circle';
      if (entry) {
        if (entry.ruta) {
          ruta = entry.ruta.startsWith('/')
            ? entry.ruta
            : `/${entry.ruta}`;
        }
        icon = entry.icono;
      }
      const hijos = n.hijos && n.hijos.length > 0
        ? this.enrichTree(n.hijos)
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

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private restoreSession(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (this.isTokenExpired(token)) {
      this.logout();
      return;
    }
    const roleKey = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (roleKey && username && ROLES[roleKey]) {
      this.role.set(ROLES[roleKey]);
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
          this.funcionalidades.set(null);
        }
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
    return [];
  }
}
