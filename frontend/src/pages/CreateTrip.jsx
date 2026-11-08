import { useState } from 'react';
import { api } from '../api.js';

export default function CreateTrip() {
  const [f, setF] = useState({ origin: '', destination: '', departureTime: '', seats: 3 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setMessage(''); setError('');
    try {
      await api.createTrip({ ...f, departureTime: new Date(f.departureTime).toISOString(), seats: Number(f.seats) });
      setMessage('Trip created.');
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="card narrow">
      <h2>Offer a ride</h2>
      <form onSubmit={submit}>
        <label>From <input value={f.origin} onChange={set('origin')} required /></label>
        <label>To <input value={f.destination} onChange={set('destination')} required /></label>
        <label>Date and time <input type="datetime-local" value={f.departureTime} onChange={set('departureTime')} required /></label>
        <label>Free seats <input type="number" min="1" max="8" value={f.seats} onChange={set('seats')} required /></label>
        <button type="submit">Create trip</button>
      </form>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}
      {/* TODO (team): list "my trips" with edit / cancel (FR5) */}
    </div>
  );
}
