import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/recurring', label: 'Recurring' },
  { to: '/categories', label: 'Categories' },
  { to: '/settings', label: 'Settings' }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>PennyPulse</h1>
          <p className="subtitle">Welcome, {user?.firstName}</p>
        </div>
        <button
          className="btn-outline"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Logout
        </button>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <button className="fab" onClick={() => navigate('/transactions')}>+
      </button>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
