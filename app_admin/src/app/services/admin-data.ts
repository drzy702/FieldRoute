import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AdminUser { _id: string; name: string; email: string; role: 'admin' | 'customer'; }
export interface UserInput { name: string; email: string; role: 'admin' | 'customer'; password?: string; }
export interface AdminSummary { trips: number; users: number; pages: number; editedPages: number; }
export interface PageField { key: string; label: string; type: 'text' | 'textarea' | 'image'; value: string; }
export interface SitePage { slug: string; title: string; fields: PageField[]; updatedAt: string | null; }

@Injectable({ providedIn: 'root' })
export class AdminData {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';
  getSummary() { return this.http.get<AdminSummary>(`${this.baseUrl}/admin/summary`); }
  getUsers() { return this.http.get<AdminUser[]>(`${this.baseUrl}/admin/users`); }
  createUser(user: UserInput) { return this.http.post<AdminUser>(`${this.baseUrl}/admin/users`, user); }
  updateUser(id: string, user: UserInput) { return this.http.put<AdminUser>(`${this.baseUrl}/admin/users/${id}`, user); }
  deleteUser(id: string) { return this.http.delete<void>(`${this.baseUrl}/admin/users/${id}`); }
  getPage(slug: string) { return this.http.get<SitePage>(`${this.baseUrl}/pages/${slug}`); }
  getImages() { return this.http.get<string[]>(`${this.baseUrl}/admin/images`); }
  savePage(slug: string, values: Record<string, string>) {
    return this.http.put<SitePage>(`${this.baseUrl}/pages/${slug}`, { values });
  }
}
