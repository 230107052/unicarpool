// All calls go to our Backend API. No business rules here: the UI only shows data and sends requests.
const TOKEN_KEY = 'unicarpool_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body, query } = {}) {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v)).toString() : '';
  const res = await fetch(`/api${path}${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  searchTrips: (query) => request('/trips', { query }),
  createTrip: (b) => request('/trips', { method: 'POST', body: b }),
  cancelTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  reserve: (tripId) => request('/reservations', { method: 'POST', body: { tripId } }),
  myReservations: () => request('/reservations/mine'),
  cancelReservation: (id) => request(`/reservations/${id}`, { method: 'DELETE' }),
  notifications: () => request('/notifications'),
};
