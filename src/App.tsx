import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RecordsPage from './pages/RecordsPage';
import StatsPage from './pages/StatsPage';

function UserMenuModal({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="user-menu-overlay" onClick={onClose}>
      <div className="user-menu-modal" onClick={e => e.stopPropagation()}>
        <div className="user-menu-email">{user?.email}</div>
        <div className="user-menu-divider" />
        <button className="user-menu-item" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️  Light mode' : '🌙  Dark mode'}
        </button>
        <div className="user-menu-divider" />
        {confirmSignOut ? (
          <div className="user-menu-confirm">
            <span className="user-menu-confirm-label">Sign out?</span>
            <button className="btn btn-danger btn-sm" onClick={handleSignOut}>Yes, sign out</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmSignOut(false)}>Cancel</button>
          </div>
        ) : (
          <button className="user-menu-item user-menu-item--danger" onClick={() => setConfirmSignOut(true)}>
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}

function ProtectedApp() {
  const { user, loading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppProvider>
      <div className="app-shell">
        <NavBar />
        <button
          className="user-menu-btn-mobile"
          onClick={() => setUserMenuOpen(true)}
          aria-label="User menu"
        >
          {initials}
        </button>
        {userMenuOpen && <UserMenuModal onClose={() => setUserMenuOpen(false)} />}
        <div className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProtectedApp />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
