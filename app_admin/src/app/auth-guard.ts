import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from './services/authentication';

export const authGuard: CanActivateFn = () => {
  const authService = inject(Authentication);
  return authService.isAdmin() || inject(Router).createUrlTree(['/login']);
};
