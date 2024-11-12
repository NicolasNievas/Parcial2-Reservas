import { Routes } from '@angular/router';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { CreateBookingComponent } from './create-booking/create-booking.component';

export const routes: Routes = [
    {path:'create-booking', component: CreateBookingComponent},
    {path:'bookings', component: BookingsListComponent},
];

