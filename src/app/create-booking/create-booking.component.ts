import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Service, Venue } from '../interfaces';
import { BookingService } from '../service/booking.service';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-booking.component.html',
  styleUrl: './create-booking.component.css'
})
export class CreateBookingComponent implements OnInit{
  private readonly bookingsService = inject(BookingService);
  private readonly router = inject(Router)

  venues: Venue[] = [];
  servicesList: Service[] = [];

  totalAmount: number = 0;
  discount: number = 0;
  finalAmount: number = 0;

  form: FormGroup = new FormGroup({
    companyName: new FormControl('', [Validators.required, Validators.minLength(5)]),
    companyEmail: new FormControl('', [Validators.required, Validators.email]),
    contactPhone: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]), 
    venueId: new FormControl('', [Validators.required]),
    eventDate: new FormControl(''),
    startTime: new FormControl('', [Validators.required]),
    endTime: new FormControl('', [Validators.required]),
    totalPeople: new FormControl('', [Validators.required, Validators.min(1)]),
    services: new FormArray([], [Validators.required, this.UniqueServiceValidator])
  });

  private setupValidators() {
    const venueControl = this.form.get('venueId');
    const dateControl = this.form.get('eventDate');

    if (venueControl && dateControl) {
      dateControl.setValidators([Validators.required]);
      dateControl.setAsyncValidators(this.availabilityValidator());

      venueControl.valueChanges.pipe(
        distinctUntilChanged()
      ).subscribe(() => {
        dateControl.updateValueAndValidity();
      });
    }
  }

  private availabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const venueId = this.form.get('venueId')?.value;
      const eventDate = control.value;

      if (!venueId || !eventDate) {
        return of(null);
      }

      return of(null).pipe(
        debounceTime(300),
        switchMap(() => this.bookingsService.getAvailability(venueId, eventDate)),
        map((availabilityResponse: any[]) => {
          const isAvailable = availabilityResponse?.[0]?.available ?? true;
          return isAvailable ? null : { unavailable: true };
        }),
        catchError(() => of(null))
      );
    };
  }

  get services(){
    return this.form.get('services') as FormArray;
  }

  addServicio() {
    const servicio = new FormGroup({
      serviceId: new FormControl('', [Validators.required]),
      quantity: new FormControl('', [Validators.required, Validators.min(10)]),
      startTime: new FormControl('', [Validators.required]),
      endTime: new FormControl('', [Validators.required])
    }, { validators: [this.validateTimeRange] });
    this.services.push(servicio);
  }

  eliminarServicio(index: number) {
    this.services.removeAt(index);
    this.calculateTotal();
  }

  UniqueServiceValidator(fArrya: FormArray ): ValidationErrors | null {
    const selectService = fArrya.controls.map((control) => control.value);
    const unicas = new Set(selectService).size === selectService.length;
    return unicas ? null : {duplicateService: true};
  }

  ngOnInit(): void {
    this.loadVenues();
    this.loadServices();
    this.setupValidators();
  
    this.form.valueChanges.subscribe(() => this.calculateTotal());
  }

  loadVenues() {
    this.bookingsService.getVenues().subscribe(venues => {
      this.venues = venues;
    });
  }

  loadServices() {
    this.bookingsService.getServices().subscribe(services => {
      this.servicesList = services;
    });
  }

  validateTimeRange: ValidatorFn = (control: AbstractControl) => {
    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;
    return startTime && endTime && startTime < endTime ? null : { invalidTimeRange: true };
  }

  calculateTotal() {
    const totalPeople = this.form.get('totalPeople')?.value || 0;
    const venueId = this.form.get('venueId')?.value;
    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;
  
    let subtotal = 0;
  
    this.services.controls.forEach((control) => {
      const serviceId = control.get('serviceId')?.value;
      const quantity = control.get('quantity')?.value || 0;
      const service = this.servicesList.find((s) => s.id === serviceId);
      if (service) {
        subtotal += service.pricePerPerson * quantity;
      }
    });
  
    if (venueId && startTime && endTime) {
      const venue = this.venues.find(v => v.id === venueId);
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); 
  
      if (venue) {
        subtotal += hours * venue.pricePerHour;
      }
    }
  
    this.discount = totalPeople > 100 ? subtotal * 0.15 : 0;
    this.totalAmount = subtotal;
    this.finalAmount = subtotal - this.discount;
  }

  generateBookingCode() {
    const prefix = this.form.value.companyName?.substring(0, 3).toUpperCase() || 'RES';
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${suffix}`;
  }

  onSubmit(){
    if(this.form.valid){
      const booking = {
        ...this.form.value,
        bookingCode: this.generateBookingCode(),
        totalAmount: this.finalAmount,
        status: 'pending',
        createdAt: new Date()
      }
      this.bookingsService.postBooking(booking).subscribe({
        next: () => {
          alert('La reservación se ha creado exitosamente');
          console.log('Reserva creada:', booking);
          this.form.reset();
          this.router.navigate(['/bookings']);
        },
        error: (err) => {
          console.log('Error al crear la reserva:', err);
          alert('Hubo un problema al crear la reserva. Intente nuevamente.');
        }
    });
    }
  }
}