import { useState } from 'react';
import { api } from '../api.js';

// builds an ISO window: whole day, or +-2 hours around the chosen time (approximate time, FR3)
function timeWindow(date, time) {
  const base = new Date(`${date}T${time || '00:00'}:00`);
  if (time) return { from: new Date(base.getTime() - 2 * 3600e3), to: new Date(base.getTime() + 2 * 3600e3) };
  return { from: base, to: new Date(base.getTime() + 24 * 3600e3 - 1) };
}

export default function Search() {
  const [q, setQ] = useState({ origin: '', destination: '', date: '', time: '' });
  const [trips, setTrips] = useState(null);
  const [message, setMessage] = useState('');
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  async function search(e) {
    e.preventDefault(); setMessage('');
    try {
      const w = timeWindow(q.date, q.time);
      setTrips(await api.searchTrips({ origin: q.origin, destination: q.destination, from: w.from.toISOString(), to: w.to.toISOString() }));
    } catch (err) { setMessage(err.message); }
  }
  async function reserve(id) {
    try {
      await api.reserve(id);
      setMessage('Seat reserved!');
      setTrips((t) => t.map((x) => (x.id === id ? { ...x, seats_available: x.seats_available - 1 } : x)));
    } catch (err) { setMessage(err.message); }
  }

  return (
    <div>
      <h2>Find a ride</h2>
      <form className="row" onSubmit={search}>
        <input placeholder="From" value={q.origin} onChange={set('origin')} />
        <input placeholder="To" value={q.destination} onChange={set('destination')} />
        <input type="date" value={q.date} onChange={set('date')} required />
        <input type="time" value={q.time} onChange={set('time')} />
        <button type="submit">Search</button>
      </form>
      {message && <p className="ok">{message}</p>}
      {trips && trips.length === 0 && <p>No trips found.</p>}
      {trips?.map((t) => (
        <div className="card" key={t.id}>
          <strong>{t.origin} → {t.destination}</strong>
          <div>{new Date(t.departure_time).toLocaleString()} · Driver: {t.driver?.full_name} · Seats left: {t.seats_available}</div>
          <button onClick={() => reserve(t.id)}>Reserve a seat</button>
        </div>
      ))}
    </div>
  );
}
