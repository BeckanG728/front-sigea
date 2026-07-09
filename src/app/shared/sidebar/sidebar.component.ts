import { Component, OnInit, input, output, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuEntry } from '../../core/models/menu.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.html',
})
export class SidebarComponent implements OnInit {
  readonly menuItems = input<MenuEntry[]>([]);
  readonly activeRoute = input('');
  readonly roleCss = input('');
  readonly logout = output<void>();

  private readonly collapsedSet = signal(new Set<string>());

  readonly isCollapsed = computed(() => {
    const s = this.collapsedSet();
    return (key: string) => s.has(key);
  });

  ngOnInit(): void {
    const items = this.menuItems();
    const keys = new Set<string>();
    for (const item of items) {
      if (item.type === 'group') {
        keys.add(item.dataGroup);
        for (const child of item.children) {
          if (child.type === 'subgroup') {
            keys.add(child.dataGroup);
          }
        }
      }
    }
    this.collapsedSet.set(keys);
  }

  toggleGroup(group: string): void {
    this.collapsedSet.update(s => {
      const next = new Set(s);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }
}
