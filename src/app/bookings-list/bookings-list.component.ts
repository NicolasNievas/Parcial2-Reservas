import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Booking, Venue } from '../interfaces';
import { BookingService } from '../service/booking.service';

@Component({
  selector: 'app-bookings-list',
  templateUrl: './bookings-list.component.html',
  styles: [`
    .badge { text-transform: capitalize; }
  `],
  imports: [CurrencyPipe, CommonModule, ReactiveFormsModule],
  standalone: true
})
export class BookingsListComponent  implements OnInit{
  searchTerm = new FormControl('');
  bookingsList: { booking: Booking, venue: Venue }[] = [];

  private readonly bookingsService = inject(BookingService);

  ngOnInit(): void {
    this.getBookings();
  }

  getBookings() {
    this.searchTerm.valueChanges.subscribe( data => {
      if(data === null || data === ''){
        return this.getBookings();
      }
      this.bookingsList = this.bookingsList.filter(
        x => x.booking.companyName.toUpperCase().includes(data.toUpperCase()) || x.booking.bookingCode!.toUpperCase().includes(data.toUpperCase())
      )
    })
    this.bookingsService.getBooking().subscribe(bookings => {
      this.bookingsService.getVenues().subscribe(venues => {
        this.bookingsList = bookings.map(booking => ({
          booking,
          venue: venues.find(venue => venue.id === booking.venueId)!
        }));
      });
    });
  }
 
  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'confirmed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
