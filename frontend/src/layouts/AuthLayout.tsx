import { Link, Outlet } from 'react-router-dom';
import { Building2, ShieldCheck } from 'lucide-react';
import { DemoBanner } from '../components/DemoBanner';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DemoBanner />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-navy-900 p-10 lg:flex">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-white">CivicConnect</span>
              <span className="block text-xs font-medium uppercase tracking-wider text-navy-200">
                Smart Civic Infrastructure
              </span>
            </span>
          </Link>
          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Report it. Track it. See it resolved.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-navy-100">
              A centralized platform where citizens report damaged public infrastructure with photos and GPS
              locations, and civic authorities monitor, prioritise, assign and resolve complaints with full
              transparency.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-navy-100">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-accent-500" />
                Photo + GPS reporting with an interactive map
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-accent-500" />
                Transparent priority triage and department routing
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-accent-500" />
                Full status timeline from pending to resolved
              </li>
            </ul>
          </div>
          <p className="text-xs text-navy-200">
            Aligned with United Nations SDG 9 — Industry, Innovation and Infrastructure
          </p>
        </div>
        <div className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
