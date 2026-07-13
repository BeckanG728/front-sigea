import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, take } from 'rxjs/operators';
import { DataService } from '../services/data.service';

export function uniqueDocValidator(dataService: DataService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (!value) return of(null);
    return of(value).pipe(
      debounceTime(300),
      map(v => {
        const exists = dataService.usuarios().some(u => u.doc === v || u.doc === `DNI ${v}`);
        return exists ? { unique: 'El documento ya existe' } : null;
      }),
      catchError(() => of(null)),
      take(1),
    );
  };
}
