import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import { BrandLogo } from '../components/BrandLogo';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('If your email is registered, a reset code was sent.');
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}`), 900);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-card">
      <BrandLogo />
      <h2>Forgot password</h2>
      <form onSubmit={onSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit">Send code</button>
      </form>
      <Link to="/login">Back to login</Link>
    </div>
  );
}
