import { useState } from 'react';
import { NavLink, Route, Routes, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import PrepPage from './pages/PrepPage';
import LogPage from './pages/LogPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import { useAuth } from './hooks/useAuth';
import { getSupabaseClient } from './supabaseClient';

const navClasses = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
    isActive ? 'bg-brand text-slate-900 border-brand' : 'bg-slate-800 text-slate-200 border-slate-700'
  }`;

function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow text-center max-w-sm w-full">
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();
  const { user, profile, profileError, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileError)
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow text-center max-w-md w-full space-y-3">
          <h2 className="text-lg font-semibold">Access issue</h2>
          <p className="text-sm text-slate-300">{profileError}</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/login', { replace: true });
            }}
            className="px-4 py-2 rounded-lg bg-brand text-slate-900 font-semibold"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  if (profile && profile.is_active === false)
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow text-center max-w-md w-full space-y-3">
          <h2 className="text-lg font-semibold">Account disabled</h2>
          <p className="text-sm text-slate-300">
            Your account has been disabled. Please contact an admin if you believe this is a mistake.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/login', { replace: true });
            }}
            className="px-4 py-2 rounded-lg bg-brand text-slate-900 font-semibold"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen message="Checking your session…" />;
  if (user) return <Navigate to="/prep" replace />;
  return children;
}

function AuthenticatedLayout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const supabase = getSupabaseClient();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const handleLogout = async () => {
    setSigningOut(true);
    setSignOutError('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      setSignOutError('Could not sign out. Please try again.');
    } else {
      navigate('/login', { replace: true });
    }
    setSigningOut(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-300">OMA</p>
            <h1 className="text-lg font-bold">Aircraft Temps</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex gap-2">
              <NavLink to="/prep" className={navClasses}>
                Tonight&apos;s Aircraft
              </NavLink>
              <NavLink to="/log" className={navClasses}>
                Log Temperature
              </NavLink>
              <NavLink to="/dashboard" className={navClasses}>
                Dashboard
              </NavLink>
              <NavLink to="/reports" className={navClasses}>
                Reports
              </NavLink>
              {profile?.role === 'Admin' && (
                <NavLink to="/admin" className={navClasses}>
                  Admin
                </NavLink>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 hidden sm:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 disabled:opacity-60"
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>
      {signOutError && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <p className="text-red-400 text-sm">{signOutError}</p>
        </div>
      )}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <Outlet />
      </main>
    </div>
  );
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Checking admin access…" />;
  if (profile?.role !== 'Admin') return <Navigate to="/prep" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/prep" replace />} />
        <Route path="/prep" element={<PrepPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/prep" replace />} />
    </Routes>
  );
}
