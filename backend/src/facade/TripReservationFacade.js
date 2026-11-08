/**
 * Facade design pattern (GoF, structural).
 *
 * Problem: the main user flow "create trip -> search trips -> reserve a seat"
 * spans two modules (trips, reservations). Without a facade, the HTTP layer would
 * have to know both services and how to call each of them.
 *
 * TripReservationFacade gives the HTTP layer ONE simple interface for this flow.
 * It holds no business rules and no database access: validation stays in
 * TripService / ReservationService, persistence in TripRepository and the
 * reserve_seat() database function.
 *
 * The subsystem services are injected through the constructor, so the facade can be
 * unit-tested with fakes (no Supabase, no network).
 */
export class TripReservationFacade {
  constructor({ trips, reservations }) {
    if (!trips || !reservations) {
      throw new Error('TripReservationFacade requires trips and reservations services');
    }
    this.trips = trips;
    this.reservations = reservations;
  }

  /** Driver creates a trip (FR2). */
  createTrip(token, driverId, body) {
    return this.trips.createTrip(token, driverId, body);
  }

  /** Passenger searches for trips (FR3). */
  searchTrips(token, query) {
    return this.trips.search(token, query);
  }

  /** Passenger reserves a seat (FR4); atomic part runs in PostgreSQL reserve_seat(). */
  reserveSeat(token, tripId) {
    return this.reservations.reserve(token, tripId);
  }
}
