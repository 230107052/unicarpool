import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', studentId: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      if (mode === 'login') {
        const res = await api.login({ email: form.email, password: form.password });
        await onLogin(res.accessToken);
      } else {
        const res = await api.register(form);
        setMessage(res.message); setMode('login');
      }
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="card narrow">
      <h1>UniCarpool</h1>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <>
            <label>Full name <input value={form.fullName} onChange={set('fullName')} required /></label>
            <label>Student ID <input value={form.studentId} onChange={set('studentId')} /></label>
          </>
        )}
        <label>University e-mail <input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password <input type="password" value={form.password} onChange={set('password')} required minLength={8} /></label>
        <button type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}
      <p>
        <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'No account? Register' : 'Have an account? Log in'}
        </button>
      </p>
    </div>
  );
}
