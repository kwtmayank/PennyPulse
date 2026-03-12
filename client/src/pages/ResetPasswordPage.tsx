import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/http';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromQuery = useMemo(
    () => new URLSearchParams(location.search).get('email') || '',
    [location.search]
  );
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  const onVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      setCodeVerified(true);
      setMessage('Code verified. You can now set a new password.');
    } catch (err) {
      setCodeVerified(false);
      setError((err as Error).message);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      setMessage('Password reset successful. Redirecting to login...');
      navigate('/login');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-card">
      <h2>Reset password</h2>
      <form onSubmit={onVerifyCode}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Verification code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button type="submit">Verify code</button>
      </form>

      <form onSubmit={onSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={!codeVerified}
        />
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        {!codeVerified && !message ? <p>Verify your code first, then set a new password.</p> : null}
        <button type="submit" disabled={!codeVerified}>Reset password</button>
      </form>
      <Link to="/login">Back to login</Link>
    </div>
  );
}
