import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from '../../core/services/shell-state.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  protected shellState = inject(ShellStateService);
  private destroyRef = inject(DestroyRef);

  readonly activeRoute = signal('');

  roleCss = '';
  roleInitials = '';
  roleBadgeLabel = '';
  currentUser = '';

  get menuItems() { return this.auth.getMenuEntries(); }

  constructor() {
    this.activeRoute.set(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.activeRoute.set(this.router.url);
    });

    const role = this.auth.role();
    if (role) {
      this.roleCss = role.css;
      this.roleInitials = role.initials;
      this.roleBadgeLabel = role.badgeLabel;
      this.currentUser = this.auth.usuario() ?? '';
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
