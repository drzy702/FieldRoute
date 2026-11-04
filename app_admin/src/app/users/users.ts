import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminData, AdminUser, UserInput } from '../services/admin-data';
import { Authentication } from '../services/authentication';

@Component({ selector: 'app-users', imports: [FormsModule], templateUrl: './users.html', styleUrl: './users.css' })
export class Users {
  private data = inject(AdminData);
  readonly currentUserId = inject(Authentication).getCurrentUser()._id;
  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly pendingDelete = signal<AdminUser | null>(null);
  form: UserInput = this.emptyForm();
  search = '';
  role = 'all';
  constructor() { this.loadUsers(); }
  private emptyForm(): UserInput { return { name: '', email: '', role: 'customer', password: '' }; }
  private sort(users: AdminUser[]) { return users.sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email)); }
  loadUsers() {
    this.loading.set(true); this.error.set('');
    this.data.getUsers().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: () => { this.error.set('Users could not be loaded. Please try again.'); this.loading.set(false); },
    });
  }
  addUser() {
    this.editingId.set(null); this.form = this.emptyForm();
    this.error.set(''); this.message.set(''); this.pendingDelete.set(null); this.editorOpen.set(true);
  }
  editUser(user: AdminUser) {
    this.editingId.set(user._id); this.form = { name: user.name, email: user.email, role: user.role };
    this.error.set(''); this.message.set(''); this.pendingDelete.set(null); this.editorOpen.set(true);
  }
  closeEditor() { this.editorOpen.set(false); this.form = this.emptyForm(); this.editingId.set(null); }
  saveUser() {
    if (this.saving()) return;
    this.saving.set(true); this.error.set(''); this.message.set('');
    const id = this.editingId();
    const input = { name: this.form.name, email: this.form.email, role: this.form.role };
    const request = id ? this.data.updateUser(id, input) : this.data.createUser({ ...input, password: this.form.password });
    request.subscribe({
      next: user => {
        this.users.update(users => this.sort([...users.filter(existing => existing._id !== user._id), user]));
        this.saving.set(false); this.closeEditor(); this.message.set(id ? 'User updated.' : 'User created.');
      },
      error: error => { this.saving.set(false); this.error.set(error.error?.message || 'The user could not be saved. Please try again.'); },
    });
  }
  confirmDelete(user: AdminUser) {
    this.closeEditor(); this.error.set(''); this.message.set(''); this.pendingDelete.set(user);
  }
  deleteUser() {
    const user = this.pendingDelete();
    if (!user || this.saving()) return;
    this.saving.set(true); this.error.set('');
    this.data.deleteUser(user._id).subscribe({
      next: () => {
        this.users.update(users => users.filter(existing => existing._id !== user._id));
        this.saving.set(false); this.pendingDelete.set(null); this.message.set('User deleted.');
      },
      error: error => { this.saving.set(false); this.error.set(error.error?.message || 'The user could not be deleted. Please try again.'); },
    });
  }
  get filteredUsers() {
    const query = this.search.trim().toLowerCase();
    return this.users().filter(user => `${user.name} ${user.email}`.toLowerCase().includes(query) && (this.role === 'all' || user.role === this.role));
  }
}
