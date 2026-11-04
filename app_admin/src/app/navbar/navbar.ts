import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Authentication } from '../services/authentication';

@Component({ selector: 'app-navbar', imports: [RouterLink, RouterLinkActive], templateUrl: './navbar.html', styleUrl: './navbar.css' })
export class Navbar {
  private authentication = inject(Authentication);
  private router = inject(Router);
  isLoggedIn() { return this.authentication.isLoggedIn(); }
  isAdmin() { return this.authentication.isAdmin(); }
  onLogout() {
    this.router.navigate(['/login']).then(navigated => {
      if (navigated) this.authentication.logout();
    });
  }
}
