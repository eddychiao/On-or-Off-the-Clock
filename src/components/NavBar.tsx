import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './NavBar.css';

const NAV_ITEMS = [
  { to: '/', icon: '⏱', label: 'Today' },
  { to: '/records', icon: '📋', label: 'Records' },
  { to: '/stats', icon: '📊', label: 'Stats' },
];

export default function NavBar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="navbar-logo-title">
          <span>On</span><span>/Off</span>
          <br />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600 }}>the Clock</span>
        </div>
        <div className="navbar-logo-sub">Time Tracker</div>
      </div>

      <div className="navbar-nav">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-footer">
        <div className="navbar-user">
          <div className="navbar-avatar">{initials}</div>
          <div className="navbar-user-email">{user?.email}</div>
        </div>
        <div className="navbar-footer-actions">
          <button
            className="btn-icon navbar-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {signOutConfirm ? (
            <>
              <span className="navbar-signout-confirm-label">Sign out?</span>
              <button className="btn btn-danger btn-sm" onClick={signOut}>Yes</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSignOutConfirm(false)}>No</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm navbar-signout" onClick={() => setSignOutConfirm(true)}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
