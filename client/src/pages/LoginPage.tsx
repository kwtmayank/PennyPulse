import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

type LoginUser = {
  id: string;
  firstName: string;
  lastName: string;
  userId: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
};

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.post<{ user: LoginUser }>('/auth/login', { identifier, password });
      setAuthUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card login-card">
        <BrandLogo />
        <h2>Login to Penny Pulse</h2>
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
    </div>
  );
}
