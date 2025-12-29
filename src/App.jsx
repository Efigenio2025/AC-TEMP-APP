import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import PrepPage from './pages/PrepPage';
import LogPage from './pages/LogPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './hooks/useAuth';

const navClasses = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
    isActive ? 'bg-brand text-slate-900 border-brand' : 'bg-slate-800 text-slate-200 border-slate-700'
  }`;

function UserBadge() {
  const { user } = useAuth();
  if (!user) return null;
  return <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">{user.email}</span>;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand">OMA</p>
              <h1 className="text-lg font-bold">Aircraft Temps</h1>
            </div>
            <nav className="flex items-center gap-2">
              <NavLink to="/prep" className={navClasses}>
                Tonight's Aircraft
              </NavLink>
              <NavLink to="/log" className={navClasses}>
                Log Temperature
              </NavLink>
              <NavLink to="/dashboard" className={navClasses}>
                Dashboard
              </NavLink>
              <NavLink to="/login" className={navClasses}>
                Login
              </NavLink>
              <UserBadge />
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-12">
          <Routes>
            <Route path="/" element={<Navigate to="/prep" replace />} />
            <Route path="/prep" element={<PrepPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
