-- University Carpooling System: database schema for Supabase (PostgreSQL)
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

-- ============ Tables ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  student_id text unique,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  origin text not null,
  destination text not null,
  departure_time timestamptz not null,
  seats_total int not null check (seats_total > 0),
  seats_available int not null check (seats_available >= 0),
  status text not null default 'active' check (status in ('active', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  check (seats_available <= seats_total)
);
-- supports the "search within 3 s" scenario from Milestone 1
create index trips_search_idx on public.trips (status, departure_time, origin, destination);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- notification queue: Backend (via DB functions) writes, Notification Worker sends
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notifications_pending_idx on public.notifications (status, created_at);

-- ============ Helper functions ============
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- create profile automatically when a student signs up (Supabase Auth)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, student_id)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
          nullif(new.raw_user_meta_data ->> 'student_id', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- reserve a seat atomically (no double booking): lock the trip row, check, insert, decrement
create or replace function public.reserve_seat(p_trip_id uuid) returns public.reservations
language plpgsql security definer set search_path = public as $$
declare t public.trips; r public.reservations;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into t from public.trips where id = p_trip_id for update;
  if not found or t.status <> 'active' then raise exception 'trip not available'; end if;
  if t.driver_id = auth.uid() then raise exception 'driver cannot reserve own trip'; end if;
  if t.seats_available < 1 then raise exception 'no seats available'; end if;
  insert into public.reservations (trip_id, passenger_id) values (p_trip_id, auth.uid()) returning * into r;
  update public.trips set seats_available = seats_available - 1 where id = p_trip_id;
  insert into public.notifications (user_id, subject, body)
    values (t.driver_id, 'New reservation', 'A passenger reserved a seat on your trip to ' || t.destination || '.');
  return r;
end $$;

create or replace function public.cancel_reservation(p_reservation_id uuid) returns public.reservations
language plpgsql security definer set search_path = public as $$
declare r public.reservations; t public.trips;
begin
  select * into r from public.reservations where id = p_reservation_id and passenger_id = auth.uid() for update;
  if not found then raise exception 'reservation not found'; end if;
  if r.status = 'cancelled' then return r; end if;
  update public.reservations set status = 'cancelled' where id = r.id returning * into r;
  update public.trips set seats_available = seats_available + 1 where id = r.trip_id returning * into t;
  insert into public.notifications (user_id, subject, body)
    values (t.driver_id, 'Reservation cancelled', 'A passenger cancelled a seat on your trip to ' || t.destination || '.');
  return r;
end $$;

-- FR7: notify passengers when a trip is edited or cancelled
create or replace function public.notify_trip_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.origin, new.destination, new.departure_time, new.status)
     is distinct from (old.origin, old.destination, old.departure_time, old.status) then
    insert into public.notifications (user_id, subject, body)
    select res.passenger_id,
           case when new.status = 'cancelled' then 'Trip cancelled' else 'Trip changed' end,
           'Your trip ' || new.origin || ' -> ' || new.destination || ' was ' ||
           case when new.status = 'cancelled' then 'cancelled' else 'changed' end || ' by the driver.'
    from public.reservations res where res.trip_id = new.id and res.status = 'confirmed';
  end if;
  return new;
end $$;
create trigger trips_notify_change after update on public.trips
  for each row execute function public.notify_trip_change();

-- ============ Row Level Security (second line of defence) ============
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.reservations enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

-- profiles: readable by signed-in users, but only non-sensitive columns (no student_id), nobody can edit role
revoke all on public.profiles from anon, authenticated;
grant select (id, full_name, role) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (true);

-- trips: signed-in users can read; only the driver can create/edit own trips; seats are changed only by DB functions
revoke all on public.trips from anon;
revoke update on public.trips from authenticated;
grant update (origin, destination, departure_time, status) on public.trips to authenticated;
create policy trips_read on public.trips for select to authenticated using (true);
create policy trips_insert on public.trips for insert to authenticated
  with check (driver_id = auth.uid() and seats_available = seats_total);
create policy trips_update on public.trips for update to authenticated
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

-- reservations: visible only to the passenger and to the driver of that trip; written only via reserve_seat / cancel_reservation
revoke all on public.reservations from anon;
revoke insert, update, delete on public.reservations from authenticated;
create policy reservations_read on public.reservations for select to authenticated using (
  passenger_id = auth.uid()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);

-- reports: any user can file one; only admins read/update
revoke all on public.reports from anon;
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_admin_read on public.reports for select to authenticated using (public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated using (public.is_admin());

-- notifications: users read only their own; writes only by DB functions / service_role (Worker)
revoke all on public.notifications from anon;
revoke insert, update, delete on public.notifications from authenticated;
create policy notifications_read on public.notifications for select to authenticated using (user_id = auth.uid());

-- To make yourself an admin (run once in SQL Editor, replace the id):
-- update public.profiles set role = 'admin' where id = '<your-user-uuid>';
