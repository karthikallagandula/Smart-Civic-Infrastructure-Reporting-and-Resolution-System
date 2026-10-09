import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  PlusCircle,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from '../components/NotificationBell';
import { DemoBanner } from '../components/DemoBanner';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CITIZEN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/report', label: 'Report an Issue', icon: PlusCircle },
  { to: '/complaints', label: 'My Complaints', icon: FileText },
  { to: '/map', label: 'Complaints Map', icon: Map },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/admin/map', label: 'Complaints Map', icon: Map },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600 text-white">
        <Building2 className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-sm font-bold text-white">CivicConnect</span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-navy-200">
            SDG 9 · Infrastructure
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : CITIZEN_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900">
      <div className="flex items-center justify-between px-4 py-4">
        <Brand />
        <button className="text-navy-200 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-3 mb-3 rounded-lg bg-navy-800 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          {isAdmin ? 'Administrator' : 'Citizen'}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate text-xs text-navy-200">{user?.email}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/dashboard'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'text-navy-100 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-navy-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-100 transition hover:bg-navy-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" /> Sign out
        </button>
        <p className="mt-2 px-3 text-[10px] text-navy-200/70">
          CivicConnect · UN SDG 9 · Prototype
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">{sidebar}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <header className="sticky top-0 z-[900] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="hidden text-sm font-semibold text-slate-700 sm:block">
            {isAdmin ? 'Civic Authority Console' : 'Citizen Portal'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
              <User className="h-3.5 w-3.5" />
              {user?.name}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
