import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShellStateService {
  readonly title = signal('');
  readonly icon = signal('');
}
