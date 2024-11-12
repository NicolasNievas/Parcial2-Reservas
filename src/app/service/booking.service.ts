import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environment';
import { Observable } from 'rxjs';
import { Booking, Service, Venue } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);

  private apiBookings = 'http://localhost:3000/bookings';
  private apiVenues = 'http://localhost:3000/venues';
  private apiServices = 'http://localhost:3000/services';
  private apiAvailability ='http://localhost:3000/availability';

  getBooking(): Observable<Booking[]>{
    return this.http.get<Booking[]>(this.apiBookings);
  }

  postBooking(booking: Booking): Observable<Booking>{
    return this.http.post<Booking>(this.apiBookings, booking);
  }

  getVenues(): Observable<Venue[]>{
    return this.http.get<Venue[]>(this.apiVenues);
  }

  getServices(): Observable<Service[]>{
    return this.http.get<Service[]>(this.apiServices);
  }

  getAvailability(venueId: string, date: string): Observable<any>{
    return this.http.get(`${this.apiAvailability}?venueId=${venueId}&date=${date}`);
  }
}
