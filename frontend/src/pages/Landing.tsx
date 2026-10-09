import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Globe2,
  MapPin,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DemoBanner } from '../components/DemoBanner';

const FEATURES = [
  {
    icon: Camera,
    title: 'Report with photo & GPS',
    text: 'Capture the issue on camera and pin the exact location using GPS or an interactive map.',
  },
  {
    icon: ClipboardList,
    title: 'Transparent tracking',
    text: 'Follow every complaint through Pending → Assigned → In Progress → Resolved with a full timeline.',
  },
  {
    icon: MapPin,
    title: 'Live complaints map',
    text: 'See reported issues around you on an OpenStreetMap view, colour-coded by priority.',
  },
  {
    icon: Wrench,
    title: 'Department assignment',
    text: 'Issues are routed to the right department — roads, electrical, water supply, sanitation.',
  },
  {
    icon: BarChart3,
    title: 'Authority analytics',
    text: 'Civic authorities get category, status, department and resolution-time insights.',
  },
  {
    icon: ShieldCheck,
    title: 'Accountable by design',
    text: 'Server-side role checks, validated inputs and an auditable status history for every change.',
  },
];

const STEPS = [
  { title: 'Report', text: 'Citizens submit a complaint with a photo and location.' },
  { title: 'Prioritise', text: 'A transparent rule-based engine suggests a priority and department.' },
  { title: 'Assign', text: 'An administrator assigns it to the responsible department and team.' },
  { title: 'Resolve', text: 'Work is tracked and closed with resolution notes and a repair photo.' },
];

export function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/register';
  const primaryLabel = user ? 'Go to dashboard' : 'Get started';

  return (
    <div className="min-h-screen bg-white">
      <DemoBanner />
      <header className="sticky top-0 z-[800] border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-navy-900">CivicConnect</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Smart Civic Infrastructure
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link
                to={primaryHref}
                className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
              >
                {primaryLabel}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-100"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-navy-900">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-500/40 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-500">
              <Globe2 className="h-3.5 w-3.5" /> Aligned with UN SDG 9
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Report civic infrastructure problems.
              <span className="text-accent-500"> Track them to resolution.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-100">
              Potholes, broken streetlights, open manholes, leaking pipelines and overflowing drains often go
              unreported. CivicConnect gives citizens one place to report them and gives authorities one place
              to see, prioritise and resolve them.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={primaryHref}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              {!user ? (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-navy-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800"
                >
                  Administrator sign in
                </Link>
              ) : null}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-navy-800 pt-6 text-white">
              <div>
                <p className="text-2xl font-bold text-accent-500">7</p>
                <p className="text-xs text-navy-200">Issue categories</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-500">5</p>
                <p className="text-xs text-navy-200">Responsible departments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-500">4</p>
                <p className="text-xs text-navy-200">Lifecycle stages</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-800/60 p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Complaint lifecycle</p>
                <span className="rounded-full bg-accent-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-500">
                  Live tracking
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { status: 'Pending', color: 'bg-amber-400', note: 'Submitted by citizen' },
                  { status: 'Assigned', color: 'bg-sky-400', note: 'Routed to Roads Department' },
                  { status: 'In Progress', color: 'bg-indigo-400', note: 'Field crew dispatched' },
                  { status: 'Resolved', color: 'bg-accent-500', note: 'Repair verified with photo' },
                ].map((step, index) => (
                  <div key={step.status} className="flex items-start gap-3 rounded-lg bg-navy-900/60 p-3">
                    <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${step.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {index + 1}. {step.status}
                      </p>
                      <p className="text-xs text-navy-200">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Everything both sides need</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            A single platform serving citizens who report and authorities who resolve.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="inline-flex rounded-lg bg-navy-50 p-2.5 text-navy-700">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-navy-900 px-6 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-accent-500" />
          <h2 className="max-w-2xl text-2xl font-bold text-white sm:text-3xl">
            Help make public infrastructure safer and more accountable
          </h2>
          <p className="max-w-2xl text-sm text-navy-100">
            Priorities in this prototype are suggested by a transparent rule-based system and are not a safety
            determination — trained administrators review and can override every suggestion.
          </p>
          <Link
            to={primaryHref}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700"
          >
            {primaryLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-400 sm:flex-row sm:px-6">
          <p>CivicConnect — Smart Civic Infrastructure Reporting &amp; Resolution System</p>
          <p>Prototype · UN SDG 9: Industry, Innovation and Infrastructure</p>
        </div>
      </footer>
    </div>
  );
}
