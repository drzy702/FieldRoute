import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from './services/authentication';

// Guard to protect routes
export const authGuard: CanActivateFn = () => {

  const authService = inject(Authentication);
  const router = inject(Router);

  // If logged in → allow access
  if (authService.isLoggedIn()) {
    return true;
  }

  // If not → redirect to login
  router.navigate(['/login']);
  return false;
};
