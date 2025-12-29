import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();
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
      setError(signInError.message);
      return;
    }
    navigate('/log');
  };

  return (
    <div className="py-6">
      <div className="max-w-md mx-auto bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow">
        <p className="text-xs uppercase text-brand mb-1">Access</p>
        <h2 className="text-xl font-bold mb-4">Sign in</h2>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <form className="space-y-3" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
