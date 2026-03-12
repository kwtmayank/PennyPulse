import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/http';

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userId: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-card">
      <h2>Create PennyPulse account</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <input placeholder="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Mobile (optional)" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
      </form>
      <Link to="/login">Already have an account?</Link>
    </div>
  );
}
