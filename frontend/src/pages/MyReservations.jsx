import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function MyReservations() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const load = () => api.myReservations().then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    try { await api.cancelReservation(id); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <h2>My reservations</h2>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p>No reservations yet.</p>}
      {items.map((r) => (
        <div className="card" key={r.id}>
          <strong>{r.trip?.origin} → {r.trip?.destination}</strong>
          <div>{r.trip && new Date(r.trip.departure_time).toLocaleString()} · Driver: {r.trip?.driver?.full_name} · {r.status}</div>
          {r.status === 'confirmed' && <button onClick={() => cancel(r.id)}>Cancel</button>}
        </div>
      ))}
      {/* TODO (team): notifications list (api.notifications) */}
    </div>
  );
}
