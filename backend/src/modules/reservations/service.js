import { userClient } from '../../config/supabase.js';
import { HttpError } from '../../shared/httpError.js';
import { throwIfError } from '../../shared/dbError.js';

const COLUMNS = 'id, status, created_at, trip:trips(id, origin, destination, departure_time, status, driver:profiles(full_name))';

export async function listMine(token, userId) {
  const { data, error } = await userClient(token).from('reservations').select(COLUMNS)
    .eq('passenger_id', userId).order('created_at', { ascending: false });
  throwIfError(error);
  return data;
}

// Another user's reservation is hidden by RLS and answered with 404 (no information leaks).
export async function getOne(token, id) {
  const { data, error } = await userClient(token).from('reservations').select(COLUMNS).eq('id', id).single();
  throwIfError(error);
  return data;
}

// FR4: atomic seat reservation is done inside the database (reserve_seat)

export async function reserve(token, tripId, clientFactory = userClient) {
  if (!tripId) throw new HttpError(400, 'tripId is required');

  const { data, error } = await clientFactory(token).rpc('reserve_seat', {
    p_trip_id: tripId
  });

  throwIfError(error);
  return data;
}


export async function cancel(token, id) {
  const { data, error } = await userClient(token).rpc('cancel_reservation', { p_reservation_id: id });
  throwIfError(error);
  return data;
}
