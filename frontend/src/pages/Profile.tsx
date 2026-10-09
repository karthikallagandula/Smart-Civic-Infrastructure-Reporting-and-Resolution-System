import { useState } from 'react';
import { Building2, Mail, ShieldCheck, User as UserIcon, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/constants';
import { useHealth } from '../components/DemoBanner';

export function Profile() {
  const { user, logout } = useAuth();
  const health = useHealth();
  const [touched, setTouched] = useState(false);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Profile</h1>

      {health?.demoMode ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This account exists only in demo mode. Account data is stored in memory and resets when the server
          restarts; switching to MongoDB stores accounts in the database.
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-white">
            {(user.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                user.role === 'admin' ? 'bg-navy-800 text-white' : 'bg-accent-100 text-accent-700'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.role === 'admin' ? 'Administrator' : 'Citizen'}
            </span>
          </div>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <dt className="w-24 text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{user.email}</dd>
          </div>
          <div className="flex items-center gap-3">
            <UserIcon className="h-4 w-4 text-slate-400" />
            <dt className="w-24 text-slate-500">Name</dt>
            <dd className="font-medium text-slate-800">{user.name}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-400" />
            <dt className="w-24 text-slate-500">Joined</dt>
            <dd className="font-medium text-slate-800">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setTouched(true);
              setTimeout(() => setTouched(false), 2500);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Change password
          </button>
          <button
            onClick={logout}
            className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            Sign out
          </button>
        </div>
        {touched ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Password change is disabled in this prototype — user management is handled by the authority.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
          <Building2 className="h-4 w-4 text-navy-600" /> About CivicConnect
        </h2>
        <p className="leading-relaxed text-slate-500">
          CivicConnect is a prototype supporting UN Sustainable Development Goal 9 (industry, innovation and
          infrastructure). It lets citizens submit geotagged reports with photographic evidence and lets civic
          authorities prioritise, assign, track and resolve them with a full audit trail.
        </p>
      </section>
    </div>
  );
}