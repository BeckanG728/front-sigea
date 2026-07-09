import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dniValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const pattern = /^\d{8}$/;
    return pattern.test(value) ? null : { dni: 'El DNI debe tener exactamente 8 dígitos' };
  };
}
