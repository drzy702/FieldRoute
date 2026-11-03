import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';
import { Authentication } from '../services/authentication';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-card.html',
  styleUrl: './trip-card.css',
})
export class TripCard implements OnInit {
  @Input('trip') trip: any;
  // This sends the delete event to the parent component
  @Output() deleteTripEvent = new EventEmitter<string>();

  constructor(
    private router: Router,
    private authenticationService: Authentication,
  ) {}

  ngOnInit(): void {}

  public editTrip(trip: Trip) {
    localStorage.removeItem('tripCode');
    localStorage.setItem('tripCode', trip.code);
    this.router.navigate(['edit-trip']);
  }

  // Send the trip code to the parent component for deleting
  public deleteTrip(trip: Trip): void {
    this.deleteTripEvent.emit(trip.code);
  }

  public isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }
}
