import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import PrepPage from './pages/PrepPage';
import LogPage from './pages/LogPage';
import DashboardPage from './pages/DashboardPage';

const navClasses = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
    isActive ? 'bg-brand text-slate-900 border-brand' : 'bg-slate-800 text-slate-200 border-slate-700'
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-300">OMA</p>
            <h1 className="text-lg font-bold">Aircraft Temps</h1>
          </div>
          <nav className="flex gap-2">
            <NavLink to="/prep" className={navClasses}>
              Tonight's Aircraft
            </NavLink>
            <NavLink to="/log" className={navClasses}>
              Log Temperature
            </NavLink>
            <NavLink to="/dashboard" className={navClasses}>
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <Routes>
          <Route path="/" element={<Navigate to="/prep" replace />} />
          <Route path="/prep" element={<PrepPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}