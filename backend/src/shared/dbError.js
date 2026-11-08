import { HttpError } from './httpError.js';

// Translate Supabase/PostgREST/Postgres errors into HTTP errors without leaking internals.
export function throwIfError(error) {
  if (!error) return;
  if (error.code === 'PGRST116') throw new HttpError(404, 'Not found'); // no row (or hidden by RLS)
  if (error.code === '23505') throw new HttpError(409, 'Already exists');
  if (error.code === '42501') throw new HttpError(403, 'Forbidden');
  if (error.code === 'P0001') {
    // messages raised by our SQL functions (reserve_seat, cancel_reservation)
    const status = error.message === 'no seats available' ? 409 : 400;
    throw new HttpError(status, error.message);
  }
  console.error('Database error:', error);
  throw new HttpError(500, 'Internal server error');
}
