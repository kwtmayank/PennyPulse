import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
  { to: '/transactions', label: 'Transactions', icon: 'TX' },
  { to: '/recurring', label: 'Scheduled', icon: 'SC' },
  { to: '/categories', label: 'Categories', icon: 'CT' },
  { to: '/settings', label: 'Settings', icon: 'ST' }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <BrandLogo compact />
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
        </div>
      </header>

      <div className="app-shell">
        <main className="content">
          <Outlet />
        </main>

        <button className="fab" onClick={() => navigate('/transactions')}>
          +
        </button>

        <nav className="bottom-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="nav-chip">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
