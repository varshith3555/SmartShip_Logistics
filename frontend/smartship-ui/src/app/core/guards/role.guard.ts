import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];
  if (allowed.length === 0) return true;

  const role = (auth.role ?? '').toUpperCase();
  const ok = allowed.map((r) => r.toUpperCase()).includes(role);

  if (!ok) {
    router.navigate(['/access-denied']);
  }

  return ok;
};
