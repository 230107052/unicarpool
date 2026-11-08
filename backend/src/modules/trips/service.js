import { HttpError } from '../../shared/httpError.js';
import * as repo from './repository.js';

const isDate = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const text = (v) => typeof v === 'string' && v.trim().length > 0;

// FR3: search by start, destination, date and approximate time (from/to window)
export function search(token, q) {
  if (!isDate(q.from) || !isDate(q.to)) throw new HttpError(400, 'from and to (ISO date-time) are required');
  return repo.search(token, q);
}

export const getTrip = (token, id) => repo.findById(token, id);

// FR2: driver creates a trip
export function createTrip(token, driverId, b) {
  if (!text(b.origin) || !text(b.destination)) throw new HttpError(400, 'origin and destination are required');
  if (!isDate(b.departureTime) || Date.parse(b.departureTime) <= Date.now())
    throw new HttpError(400, 'departureTime must be a future date-time');
  const seats = Number(b.seats);
  if (!Number.isInteger(seats) || seats < 1 || seats > 8) throw new HttpError(400, 'seats must be 1-8');
  return repo.create(token, {
    driver_id: driverId, origin: b.origin.trim(), destination: b.destination.trim(),
    departure_time: b.departureTime, seats_total: seats, seats_available: seats,
  });
}

// FR5: driver edits a trip (passengers are notified by a database trigger, FR7)
export function updateTrip(token, id, b) {
  const fields = {};
  if (b.origin !== undefined) { if (!text(b.origin)) throw new HttpError(400, 'invalid origin'); fields.origin = b.origin.trim(); }
  if (b.destination !== undefined) { if (!text(b.destination)) throw new HttpError(400, 'invalid destination'); fields.destination = b.destination.trim(); }
  if (b.departureTime !== undefined) { if (!isDate(b.departureTime)) throw new HttpError(400, 'invalid departureTime'); fields.departure_time = b.departureTime; }
  if (!Object.keys(fields).length) throw new HttpError(400, 'nothing to update');
  return repo.update(token, id, fields);
}

// FR5: driver cancels a trip
export const cancelTrip = (token, id) => repo.update(token, id, { status: 'cancelled' });
