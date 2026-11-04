import { Routes } from '@angular/router';
import { TripListing } from './trip-listing/trip-listing';
import { addTrip } from './add-trip/add-trip';
import { EditTrip } from './edit-trip/edit-trip';
import { Login } from './login/login';
import { authGuard } from './auth-guard';
import { Dashboard } from './dashboard/dashboard';
import { Users } from './users/users';
import { PageEditor, unsavedPageGuard } from './page-editor/page-editor';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Dashboard, canActivate: [authGuard], pathMatch: 'full' },
  { path: 'trips', component: TripListing, canActivate: [authGuard] },
  { path: 'users', component: Users, canActivate: [authGuard] },
  { path: 'pages/:slug', component: PageEditor, canActivate: [authGuard], canDeactivate: [unsavedPageGuard] },
  { path: 'add-trip', component: addTrip, canActivate: [authGuard] },
  { path: 'edit-trip', component: EditTrip, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
