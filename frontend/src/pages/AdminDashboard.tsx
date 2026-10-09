import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Map as MapIcon,
  Search,
} from 'lucide-react';
import { adminApi } from '../services/api';
import { Analytics, Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { ErrorState, EmptyState } from '../components/States';
import { Spinner } from '../components/Spinner';
import { CATEGORY_LABELS, formatDate, timeAgo } from '../utils/constants';
import { reportDetailPath } from '../utils/paths';

export function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recent, setRecent] = useState<Report[]>([]);
  const [pending, setPending] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, list] = await Promise.all([adminApi.analytics(), adminApi.list({ limit: 8 })]);
      setAnalytics(stats);
      setRecent(list.items);
      const all = await adminApi.list({ limit: 100, status: 'pending' });
      setPending(all.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <Spinner label="Loading authority dashboard…" />;
  if (error || !analytics) return <ErrorState message={error || 'No data available'} onRetry={load} />;

  const highPriorityOpen = [...analytics.byPriority].find((p) => p.name === 'High')?.value ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-navy-900 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-500">Civic Authority Console</p>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-navy-100">
            {analytics.totalReports} total complaints · {analytics.resolutionRate}% resolution rate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700"
          >
            <ClipboardList className="h-4 w-4" /> Manage complaints
          </Link>
          <Link
            to="/admin/map"
            className="inline-flex items-center gap-2 rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <MapIcon className="h-4 w-4" /> Open map
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total reports" value={analytics.totalReports} icon={Activity} tone="navy" />
        <StatCard label="Pending" value={analytics.byStatus.find((s) => s.name === 'Pending')?.value ?? 0} icon={Clock} tone="amber" />
        <StatCard
          label="Assigned"
          value={analytics.byStatus.find((s) => s.name === 'Assigned')?.value ?? 0}
          icon={Search}
          tone="sky"
        />
        <StatCard
          label="In progress"
          value={analytics.byStatus.find((s) => s.name === 'In Progress')?.value ?? 0}
          icon={Loader2}
          tone="indigo"
        />
        <StatCard label="Resolved" value={analytics.byStatus.find((s) => s.name === 'Resolved')?.value ?? 0} icon={CheckCircle2} tone="green" />
        <StatCard label="High priority" value={highPriorityOpen} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Latest complaints</h2>
              <Link to="/admin/complaints" className="text-xs font-semibold text-navy-700 hover:text-navy-900">
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState title="No complaints yet" message="New reports will appear here as citizens submit them." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-2 font-semibold">Complaint</th>
                      <th className="pb-2 pr-2 font-semibold">Category</th>
                      <th className="pb-2 pr-2 font-semibold">Status</th>
                      <th className="pb-2 pr-2 font-semibold">Priority</th>
                      <th className="pb-2 font-semibold">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((report) => (
                      <tr key={report.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 pr-2">
                          <Link
                            to={reportDetailPath(report.id, 'admin')}
                            className="font-semibold text-navy-800 hover:text-navy-600"
                          >
                            {report.complaintId}
                          </Link>
                          <p className="max-w-[260px] truncate text-xs text-slate-400">{report.title}</p>
                        </td>
                        <td className="py-2.5 pr-2 text-slate-600">{CATEGORY_LABELS[report.category]}</td>
                        <td className="py-2.5 pr-2">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="py-2.5 pr-2">
                          <PriorityBadge priority={report.priority} suggested={report.prioritySource === 'auto'} />
                        </td>
                        <td className="py-2.5 text-xs text-slate-400">{timeAgo(report.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Attention needed</h2>
            <p className="text-xs text-slate-500">High-priority complaints still open.</p>
            {pending.length === 0 ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">All caught up.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pending.filter((r) => r.priority === 'high').slice(0, 5).map((report) => (
                  <li key={report.id}>
                    <Link
                      to={reportDetailPath(report.id, 'admin')}
                      className="flex items-start justify-between gap-2 rounded-lg border border-rose-100 bg-rose-50/50 p-2.5 hover:border-rose-200"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-bold text-rose-700">{report.complaintId}</p>
                        <p className="truncate text-xs font-medium text-slate-700">{report.title}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(report.createdAt)}</p>
                      </div>
                      <PriorityBadge priority={report.priority} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Performance snapshot</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Resolution rate</dt>
                <dd className="font-bold text-slate-800">{analytics.resolutionRate}%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Avg. resolution time</dt>
                <dd className="font-bold text-slate-800">
                  {analytics.averageResolutionHours != null
                    ? `${analytics.averageResolutionHours} hrs`
                    : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">High-priority open</dt>
                <dd className="font-bold text-rose-600">{analytics.highPriorityOpen}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Departments involved</dt>
                <dd className="font-bold text-slate-800">{analytics.byDepartment.length}</dd>
              </div>
            </dl>
            <Link
              to="/admin/analytics"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Open full analytics
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}