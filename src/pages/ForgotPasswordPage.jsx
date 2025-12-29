import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

export default function ForgotPasswordPage() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetRedirectUrl = useMemo(() => {
    const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || window.location.origin;
    return `${siteUrl}/reset-password`;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message || 'Unable to send reset email right now.');
      return;
    }
    setStatus('Check your email for a secure reset link.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700 rounded-xl p-6 shadow">
        <div className="mb-4">
          <p className="text-xs uppercase text-brand mb-1 tracking-wide">Access</p>
          <h2 className="text-xl font-bold">Reset password</h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter your account email and we&apos;ll send you a Supabase reset link.
          </p>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {status && <p className="text-emerald-400 text-sm mb-3">{status}</p>}
        <form className="space-y-3" onSubmit={handleSubmit}>
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
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark font-semibold text-slate-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending link…' : 'Send reset email'}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-300 flex items-center justify-between">
          <span>Remembered your password?</span>
          <Link to="/login" className="text-brand hover:text-brand-dark font-semibold">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
