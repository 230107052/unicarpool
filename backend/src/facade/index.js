import * as tripService from '../modules/trips/service.js';
import * as reservationService from '../modules/reservations/service.js';
import { TripReservationFacade } from './TripReservationFacade.js';

// Single ready-to-use instance wired with the real services.
export const tripReservationFacade = new TripReservationFacade({
  trips: tripService,
  reservations: reservationService,
});
