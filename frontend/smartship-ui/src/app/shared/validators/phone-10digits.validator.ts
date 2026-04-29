import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a phone number contains exactly 10 digits.
 *
 * - Allows common formatting characters like spaces, dashes, parentheses, and leading +.
 * - Ignores empty values (use `Validators.required` / `trimRequired` if the field is required).
 */
export const phone10Digits: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = control.value;
  if (raw === null || raw === undefined) return null;

  const value = String(raw).trim();
  if (!value) return null;

  // Allow only digits and common formatting chars.
  if (!/^[\d\s\-()+]+$/.test(value)) {
    return { phone10Digits: true };
  }

  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? null : { phone10Digits: true };
};
