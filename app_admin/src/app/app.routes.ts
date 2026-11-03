import { Routes } from '@angular/router';
import { TripListing } from './trip-listing/trip-listing';
import { addTrip } from './add-trip/add-trip';
import { EditTrip } from './edit-trip/edit-trip';
import { Login } from './login/login';
import { authGuard } from './auth-guard'; // <-- import guard

export const routes: Routes = [
    { path: 'login', component: Login },

    // Protected routes
    { path: '', component: TripListing, canActivate: [authGuard], pathMatch: 'full' },
    { path: 'add-trip', component: addTrip, canActivate: [authGuard] },
    { path: 'edit-trip', component: EditTrip, canActivate: [authGuard] }
];
