import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminData, AdminUser } from '../services/admin-data';

@Component({ selector: 'app-users', imports: [FormsModule], templateUrl: './users.html' })
export class Users {
  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  search = '';
  role = 'all';
  constructor() {
    inject(AdminData).getUsers().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: () => { this.error.set('Users could not be loaded. Please refresh to try again.'); this.loading.set(false); },
    });
  }
  get filteredUsers() {
    const query = this.search.trim().toLowerCase();
    return this.users().filter(user => `${user.name} ${user.email}`.toLowerCase().includes(query) && (this.role === 'all' || user.role === this.role));
  }
}
