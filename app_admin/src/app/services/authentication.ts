import { Inject, Injectable } from '@angular/core';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { TripData } from './trip-data';

@Injectable({ providedIn: 'root' })
export class Authentication {
  constructor(@Inject(BROWSER_STORAGE) private storage: Storage, private tripDataService: TripData) {}
  getToken(): string { return this.storage.getItem('travlr-token') || ''; }
  saveToken(token: string): void { this.storage.setItem('travlr-token', token); }
  logout(): void { this.storage.removeItem('travlr-token'); }
  private payload() {
    try {
      const encoded = this.getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch { return null; }
  }
  isLoggedIn(): boolean { return (this.payload()?.exp || 0) > Date.now() / 1000; }
  isAdmin(): boolean { return this.isLoggedIn() && this.payload()?.role === 'admin'; }
  getCurrentUser(): User {
    const { _id, email = '', name = '', role = 'customer' } = this.payload() || {};
    return { _id, email, name, role } as User;
  }
  login(user: User, password: string) { return this.tripDataService.login(user, password); }
  register(user: User, password: string): void {
    this.tripDataService.register(user, password).subscribe({
      next: response => this.saveToken(response.token),
      error: error => console.error('Registration failed', error.status),
    });
  }
}
