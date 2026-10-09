import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Clock, FileText, Loader2, PlusCircle } from 'lucide-react';
import { reportApi } from '../services/api';
import { Report, Summary } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { ComplaintCard } from '../components/ComplaintCard';
import { EmptyState, ErrorState } from '../components/States';
import { Spinner } from '../components/Spinner';

export function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.mine();
      setReports(data.reports);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const recent = reports.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-navy-900 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-500">Citizen Portal</p>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Welcome, {user?.name?.split(' ')[0] || 'citizen'}
          </h1>
          <p className="mt-1 text-sm text-navy-100">
            Report damaged public infrastructure and follow every complaint to resolution.
          </p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          <PlusCircle className="h-4 w-4" /> Report an Issue
        </Link>
      </div>

      {loading ? (
        <Spinner label="Loading your dashboard…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total complaints" value={summary?.total ?? 0} icon={ClipboardList} tone="navy" />
            <StatCard label="Pending" value={summary?.pending ?? 0} icon={Clock} tone="amber" />
            <StatCard label="In progress" value={summary?.inProgress ?? 0} icon={Loader2} tone="indigo" />
            <StatCard label="Resolved" value={summary?.resolved ?? 0} icon={CheckCircle2} tone="green" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Recent complaints</h2>
              {reports.length > 0 ? (
                <Link to="/complaints" className="text-xs font-semibold text-navy-700 hover:text-navy-900">
                  View all
                </Link>
              ) : null}
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No complaints yet"
                message="You have not reported any issues. Report a pothole, broken streetlight or other civic problem to get started."
                action={
                  <Link
                    to="/report"
                    className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                  >
                    <PlusCircle className="h-4 w-4" /> Report an Issue
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {recent.map((report) => (
                  <ComplaintCard key={report.id} report={report} role="citizen" />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
