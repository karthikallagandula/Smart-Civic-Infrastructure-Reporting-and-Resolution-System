import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../services/api';
import { useHealth } from '../components/DemoBanner';

interface LocationState {
  from?: string;
}

export function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const health = useHealth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as LocationState | null)?.from;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError('Please enter both your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name.split(' ')[0]}.`);
      const target = from || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setFormError(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700">
          <Lock className="h-3.5 w-3.5" /> Secure sign in
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to report issues or manage complaints.</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              placeholder="Your password"
            />
          </div>
        </div>

        {formError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-navy-700 hover:text-navy-900">
          Create a citizen account
        </Link>
      </p>

      {health?.demoMode && health.demoAccounts?.length ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
            <ShieldCheck className="h-3.5 w-3.5" /> Demo accounts (demo mode only)
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Sample credentials for evaluation. These exist only while running without MongoDB and are never
            used in production.
          </p>
          <div className="mt-2 space-y-1.5">
            {health.demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                className="block w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-left text-xs hover:border-amber-300"
              >
                <span className="font-semibold capitalize text-amber-900">{account.role}: </span>
                <span className="text-slate-600">
                  {account.email} / {account.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
