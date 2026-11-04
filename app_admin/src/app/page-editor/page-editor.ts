import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AdminData, SitePage } from '../services/admin-data';

@Component({ selector: 'app-page-editor', imports: [FormsModule, DatePipe], templateUrl: './page-editor.html', styleUrl: './page-editor.css' })
export class PageEditor {
  private data = inject(AdminData);
  readonly page = signal<SitePage | null>(null);
  readonly images = signal<string[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  values: Record<string, string> = {};
  private original = '';
  private load?: Subscription;
  private routeSubscription = inject(ActivatedRoute).paramMap.subscribe(params => this.loadPage(params.get('slug') || ''));

  get dirty() { return this.page() !== null && JSON.stringify(this.values) !== this.original; }
  private loadPage(slug: string) {
    this.load?.unsubscribe();
    this.page.set(null); this.loading.set(true); this.error.set(''); this.message.set('');
    this.load = forkJoin({ page: this.data.getPage(slug), images: this.data.getImages() }).subscribe({
      next: result => {
        this.page.set(result.page); this.images.set(result.images);
        this.values = Object.fromEntries(result.page.fields.map(field => [field.key, field.value]));
        this.original = JSON.stringify(this.values); this.loading.set(false);
      },
      error: () => { this.error.set('This page could not be loaded. Please refresh to try again.'); this.loading.set(false); },
    });
  }
  save() {
    const page = this.page();
    if (!page || this.saving()) return;
    this.saving.set(true); this.error.set(''); this.message.set('');
    this.data.savePage(page.slug, this.values).subscribe({
      next: saved => {
        this.page.set(saved); this.original = JSON.stringify(this.values);
        this.saving.set(false); this.message.set('Changes saved. Your customer page is now updated.');
      },
      error: error => { this.saving.set(false); this.error.set(error.error?.message || 'Your changes could not be saved. Please try again.'); },
    });
  }
  reset() {
    const page = this.page();
    if (!page) return;
    if (this.dirty && !window.confirm('Discard your unsaved changes?')) return;
    this.values = Object.fromEntries(page.fields.map(field => [field.key, field.value]));
    this.message.set('');
  }
  ngOnDestroy() { this.routeSubscription.unsubscribe(); this.load?.unsubscribe(); }
}

export const unsavedPageGuard: CanDeactivateFn<PageEditor> = component =>
  !component.dirty || window.confirm('Leave this page and discard your unsaved changes?');
