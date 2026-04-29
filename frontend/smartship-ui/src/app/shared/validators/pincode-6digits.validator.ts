import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a pincode/postal code contains exactly 6 digits.
 *
 * - Digits only.
 * - Ignores empty values (use `Validators.required` / `trimRequired` if the field is required).
 */
export const pincode6Digits: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = control.value;
  if (raw === null || raw === undefined) return null;

  const value = String(raw).trim();
  if (!value) return null;

  return /^\d{6}$/.test(value) ? null : { pincode6Digits: true };
};
