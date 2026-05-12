import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RecordsPage from './pages/RecordsPage';
import StatsPage from './pages/StatsPage';

function ProtectedApp() {
  const { user, loading } = useAuth();

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
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </HashRouter>
  );
}
