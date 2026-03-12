import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/login', { identifier, password });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-card">
      <h2>Login to PennyPulse</h2>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Email or User ID"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <div className="auth-links">
        <Link to="/register">Create account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}
