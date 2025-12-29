import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || '/prep';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message || 'Unable to sign in. Please check your email and password.');
      return;
    }
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow">
        <div className="mb-4">
          <p className="text-xs uppercase text-brand mb-1 tracking-wide">Access</p>
          <h2 className="text-xl font-bold">Sign in</h2>
          <p className="text-sm text-slate-400 mt-1">Use your Supabase email and password to continue.</p>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form className="space-y-3" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-brand hover:text-brand-dark font-semibold">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark font-semibold text-slate-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
