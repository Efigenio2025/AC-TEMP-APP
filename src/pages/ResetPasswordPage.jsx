import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

function parseHashParams(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'),
  };
}

export default function ResetPasswordPage() {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const verifyLink = async () => {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = parseHashParams(url.hash);
      const code = searchParams.get('code');

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (hashParams.accessToken && hashParams.refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hashParams.accessToken,
            refresh_token: hashParams.refreshToken,
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error('Reset link is missing or invalid. Request a new email to continue.');
        }
        if (!active) return;
        setStatus('ready');
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError(err.message || 'This reset link is invalid or expired.');
        setStatus('error');
      }
    };

    verifyLink();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || 'Unable to update password right now.');
      return;
    }
    setStatus('updated');
    setTimeout(() => navigate('/prep', { replace: true }), 900);
  };

  const showForm = status === 'ready' || status === 'updated';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow">
        <div className="mb-4">
          <p className="text-xs uppercase text-brand mb-1 tracking-wide">Access</p>
          <h2 className="text-xl font-bold">Set a new password</h2>
          <p className="text-sm text-slate-400 mt-1">
            Use the secure link from your email to choose a new password for your account.
          </p>
        </div>
        {status === 'verifying' && <p className="text-sm text-slate-300">Verifying your reset link…</p>}
        {status === 'error' && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {showForm && (
          <>
            {error && status !== 'error' && <p className="text-red-400 text-sm mb-3">{error}</p>}
            {status === 'updated' && (
              <p className="text-emerald-400 text-sm mb-3">Password updated. Redirecting you now…</p>
            )}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300" htmlFor="password">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-brand"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark font-semibold text-slate-900 disabled:opacity-50"
                disabled={loading || status === 'updated'}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
        <div className="mt-4 text-sm text-slate-300 flex items-center justify-between">
          <span>Need to try again?</span>
          <Link to="/forgot-password" className="text-brand hover:text-brand-dark font-semibold">
            Request new link
          </Link>
        </div>
      </div>
    </div>
  );
}
