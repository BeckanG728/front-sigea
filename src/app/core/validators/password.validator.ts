import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMinLength(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return value.length >= 8 ? null : { minLength: 'La clave debe tener al menos 8 caracteres' };
  };
}

export function passwordMatch(compareControl: AbstractControl): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!compareControl.value || !control.value) return null;
    return control.value === compareControl.value ? null : { match: 'Las claves no coinciden' };
  };
}
