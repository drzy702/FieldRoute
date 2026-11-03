import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripCard } from '../trip-card/trip-card';
import { Authentication } from '../services/authentication';

import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';

import { Route, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, TripCard],
  templateUrl: './trip-listing.html',
  styleUrl: './trip-listing.css',
  providers: [TripData],
})
export class TripListing implements OnInit {
  trips!: Trip[];
  message: string = '';
  currentPage: number = 1;
  pageSize: number = 4;
  searchText: string = '';
  priceFilter: string = 'all';
  sortOption: string = 'none';
  starFilter: string = 'all';

  constructor(
    private tripData: TripData,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authenticationService: Authentication,
  ) {
    console.log('trip-listing constructor');
  }

  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  // Filters and sorts the trip array before displaying it on the admin page
  public get filteredTrips(): Trip[] {
    let filtered = [...this.trips];

    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();

      filtered = filtered.filter(
        (trip) =>
          trip.name.toLowerCase().includes(search) ||
          trip.resort.toLowerCase().includes(search) ||
          trip.description.toLowerCase().includes(search),
      );
    }

    if (this.priceFilter !== 'all') {
      const maxPrice = Number(this.priceFilter);

      filtered = filtered.filter((trip) => Number(trip.perPerson) <= maxPrice);
    }

    if (this.starFilter !== 'all') {
      filtered = filtered.filter((trip) =>
        trip.resort.toLowerCase().includes(this.starFilter + ' stars'),
      );
    }

    if (this.sortOption === 'priceLowHigh') {
      filtered.sort((a, b) => Number(a.perPerson) - Number(b.perPerson));
    }

    if (this.sortOption === 'priceHighLow') {
      filtered.sort((a, b) => Number(b.perPerson) - Number(a.perPerson));
    }

    if (this.sortOption === 'nameAZ') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }

  public get paginatedTrips(): Trip[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    return this.filteredTrips.slice(startIndex, endIndex);
  }

  public get totalPages(): number {
    return Math.ceil(this.filteredTrips.length / this.pageSize);
  }

  public nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  public previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  //Delete one trip and reload the trip list
  public deleteTrip(tripCode: string): void {
    // Ask user to confirm before deleting
    const confirmed = window.confirm('Are you sure you want to delete this trip?');

    if (!confirmed) {
      return;
    }

    this.tripData.deleteTrip(tripCode).subscribe({
      next: () => {
        // Load trips again after delete
        this.getStuff();
      },
      error: (error: any) => {
        console.log('Delete error: ' + error);
      },
    });
  }

  public getStuff(): void {
    this.tripData.getTrips().subscribe({
      next: (value: any) => {
        this.trips = value;
        if (value.length > 0) {
          this.message = 'There are ' + value.length + ' trips available.';
        } else {
          this.message = 'There were no trips retrieved from the database.';
        }
        console.log(this.message);

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log('Error: ' + error);
      },
    });
  }

  ngOnInit(): void {
    console.log('ngOnInit');
    this.getStuff();
  }

  public isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }
}
