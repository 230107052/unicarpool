import test from 'node:test';
import assert from 'node:assert/strict';
import { TripReservationFacade } from './TripReservationFacade.js';

// Fake subsystem services: no Supabase and no network are used.
function makeFakes() {
  const calls = [];
  const trips = {
    createTrip: async (...args) => { calls.push(['createTrip', ...args]); return { id: 'trip-1' }; },
    search: async (...args) => { calls.push(['search', ...args]); return [{ id: 'trip-1' }]; },
  };
  const reservations = {
    reserve: async (...args) => { calls.push(['reserve', ...args]); return { id: 'res-1', status: 'confirmed' }; },
  };
  return { calls, trips, reservations };
}

test('facade runs the normal flow: create trip, search, reserve seat', async () => {
  const { calls, trips, reservations } = makeFakes();
  const facade = new TripReservationFacade({ trips, reservations });

  const trip = await facade.createTrip('tok', 'driver-1', { origin: 'A', destination: 'B' });
  const found = await facade.searchTrips('tok', { from: '2030-01-01', to: '2030-01-02' });
  const booking = await facade.reserveSeat('tok', trip.id);

  assert.equal(trip.id, 'trip-1');
  assert.equal(found.length, 1);
  assert.equal(booking.status, 'confirmed');
  assert.deepEqual(calls.map((c) => c[0]), ['createTrip', 'search', 'reserve']);
  assert.deepEqual(calls[2], ['reserve', 'tok', 'trip-1']);
});

test('facade passes errors from the reservation service unchanged (no seats available)', async () => {
  const { trips } = makeFakes();
  const reservations = {
    reserve: async () => { throw Object.assign(new Error('no seats available'), { status: 409 }); },
  };
  const facade = new TripReservationFacade({ trips, reservations });

  await assert.rejects(facade.reserveSeat('tok', 'trip-1'), (err) => {
    assert.equal(err.status, 409);
    assert.equal(err.message, 'no seats available');
    return true;
  });
});

test('facade does not accept a missing subsystem (invalid configuration)', () => {
  assert.throws(() => new TripReservationFacade({ trips: {} }), /requires trips and reservations/);
});
