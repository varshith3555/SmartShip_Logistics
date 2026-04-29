import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Like Angular's `Validators.required`, but treats whitespace-only strings as empty.
 *
 * Keeps the error key as `required` so existing `<mat-error>` checks continue working.
 */
export const trimRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined) return { required: true };

  if (typeof value === 'string') {
    return value.trim().length ? null : { required: true };
  }

  if (typeof value === 'boolean') {
    return value ? null : { required: true };
  }

  if (Array.isArray(value)) {
    return value.length ? null : { required: true };
  }

  // Numbers and other object types are treated as present.
  return null;
};
