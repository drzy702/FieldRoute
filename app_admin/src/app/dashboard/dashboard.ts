import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminData, AdminSummary } from '../services/admin-data';
import { Authentication } from '../services/authentication';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private data = inject(AdminData);
  readonly user = inject(Authentication).getCurrentUser();
  readonly summary = signal<AdminSummary | null>(null);
  readonly error = signal('');
  readonly pages = [
    { slug: 'rooms', title: 'Rooms', image: 'first-class.jpg', description: 'Room descriptions, photos, and daily rates.' },
    { slug: 'meals', title: 'Meals', image: 'seafoods.jpg', description: 'Dining options, featured dishes, and photos.' },
    { slug: 'news', title: 'News', image: 'kayak.jpg', description: 'Featured stories, headlines, and travel tips.' },
    { slug: 'about', title: 'About', image: 'sea-sound.jpg', description: 'Your story, team, and resort information.' },
  ];
  constructor() {
    this.data.getSummary().subscribe({
      next: value => this.summary.set(value),
      error: () => this.error.set('Dashboard totals could not be loaded. Please refresh to try again.'),
    });
  }
}
