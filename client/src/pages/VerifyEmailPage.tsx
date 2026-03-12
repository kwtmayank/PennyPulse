import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import { BrandLogo } from '../components/BrandLogo';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = useMemo(() => new URLSearchParams(location.search).get('email') || '', [location.search]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/auth/verify-email', { email, code });
      setOk('Email verified successfully. You can now login.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-card">
      <BrandLogo />
      <h2>Verify your email</h2>
      <p>Code sent to: {email || 'your inbox'}</p>
      <form onSubmit={onSubmit}>
        <input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        {ok && <p className="success">{ok}</p>}
        <button type="submit">Verify</button>
      </form>
      <Link to="/login">Back to login</Link>
    </div>
  );
}
