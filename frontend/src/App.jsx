import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';
import Login from './pages/Login.jsx';
import Search from './pages/Search.jsx';
import CreateTrip from './pages/CreateTrip.jsx';
import MyReservations from './pages/MyReservations.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const onLogin = async (token) => { setToken(token); setUser(await api.me()); navigate('/'); };
  const logout = () => { setToken(null); setUser(null); navigate('/login'); };

  if (loading) return <p className="center">Loading...</p>;
  if (!user) return (
    <Routes>
      <Route path="/login" element={<Login onLogin={onLogin} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  return (
    <>
      <header className="nav">
        <strong>UniCarpool</strong>
        <nav>
          <NavLink to="/" end>Find a ride</NavLink>
          <NavLink to="/offer">Offer a ride</NavLink>
          <NavLink to="/reservations">My reservations</NavLink>
        </nav>
        <span>{user.full_name} <button onClick={logout}>Log out</button></span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/offer" element={<CreateTrip />} />
          <Route path="/reservations" element={<MyReservations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
