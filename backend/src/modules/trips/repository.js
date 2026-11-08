import { userClient } from '../../config/supabase.js';
import { throwIfError } from '../../shared/dbError.js';

const COLUMNS = 'id, origin, destination, departure_time, seats_total, seats_available, status, driver_id, driver:profiles(full_name)';
const like = (s) => `%${String(s).replace(/[%_\\]/g, '\\$&')}%`;

export async function search(token, { origin, destination, from, to }) {
  let q = userClient(token).from('trips').select(COLUMNS)
    .eq('status', 'active').gt('seats_available', 0)
    .gte('departure_time', from).lte('departure_time', to)
    .order('departure_time');
  if (origin) q = q.ilike('origin', like(origin));
  if (destination) q = q.ilike('destination', like(destination));
  const { data, error } = await q.limit(50);
  throwIfError(error);
  return data;
}

export async function findById(token, id) {
  const { data, error } = await userClient(token).from('trips').select(COLUMNS).eq('id', id).single();
  throwIfError(error);
  return data;
}

export async function create(token, trip) {
  const { data, error } = await userClient(token).from('trips').insert(trip).select(COLUMNS).single();
  throwIfError(error);
  return data;
}

// RLS only lets the driver update own trips; other users get "not found".
export async function update(token, id, fields) {
  const { data, error } = await userClient(token).from('trips').update(fields).eq('id', id).select(COLUMNS).single();
  throwIfError(error);
  return data;
}
