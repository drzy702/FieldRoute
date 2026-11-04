import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Authentication } from '../services/authentication';
import { User } from '../models/user';

@Component({ selector: 'app-login', imports: [FormsModule], templateUrl: './login.html', styleUrl: './login.css' })
export class Login {
  private router = inject(Router);
  private authentication = inject(Authentication);
  readonly formError = signal('');
  readonly submitting = signal(false);
  credentials = { email: '', password: '' };
  onLoginSubmit() {
    this.formError.set('');
    if (!this.credentials.email || !this.credentials.password || this.submitting()) return;
    this.submitting.set(true);
    this.authentication.login({ email: this.credentials.email } as User, this.credentials.password).subscribe({
      next: response => {
        this.authentication.saveToken(response.token);
        this.submitting.set(false);
        if (!this.authentication.isAdmin()) {
          this.authentication.logout();
          this.formError.set('This account is a customer account. Please sign in with an admin account.');
          return;
        }
        this.router.navigate(['/']);
      },
      error: error => { this.submitting.set(false); this.formError.set(error.error?.message || 'Unable to sign in. Please try again.'); },
    });
  }
}
