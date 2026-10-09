import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { adminApi } from '../services/api';
import { Analytics } from '../types';
import { StatCard } from '../components/StatCard';
import { Spinner } from '../components/Spinner';
import { ErrorState } from '../components/States';

const STATUS_COLORS: string[] = ['#f59e0b', '#0ea5e9', '#6366f1', '#16a34a'];
const PIE_COLORS: string[] = ['#0b2545', '#1b4675', '#3770b0', '#16a34a', '#f59e0b', '#e11d48', '#94a3b8'];

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      <div className="mt-4 h-64">{children}</div>
    </section>
  );
}

const NO_DATA = [{ name: 'No data', value: 0 }];

export function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.analytics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <Spinner label="Crunching analytics…" />;
  if (error || !data) return <ErrorState message={error || 'No analytics available'} onRetry={load} />;

  const totalOpen = data.totalReports - (data.byStatus.find((s) => s.name === 'Resolved')?.value ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Analytics &amp; performance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Calculated from live application records · generated {new Date(data.generatedAt).toLocaleTimeString()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total reports" value={data.totalReports} icon={Activity} tone="navy" />
        <StatCard label="Open (unresolved)" value={totalOpen} icon={Clock} tone="amber" />
        <StatCard label="Resolved" value={data.byStatus.find((s) => s.name === 'Resolved')?.value ?? 0} icon={CheckCircle2} tone="green" />
        <StatCard label="Resolution rate" value={`${data.resolutionRate}%`} icon={CheckCircle2} tone="green" />
        <StatCard label="High priority open" value={data.highPriorityOpen} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Reports submitted over time" subtitle="Last 30 days (submitted vs resolved)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.overTime}>
              <defs>
                <linearGradient id="submitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b2545" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0b2545" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={26} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#0b2545" fill="url(#submitted)" />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" fill="#dcfce7" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Complaints by category" subtitle="Volume per infrastructure category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byCategory.length ? data.byCategory : NO_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={26} />
              <Tooltip />
              <Bar dataKey="value" name="Complaints" fill="#12345c" radius={[4, 4, 0, 0]} maxBarSize={42}>
                {data.byCategory.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Complaints by status" subtitle="Current distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.byStatus.filter((d) => d.value > 0).length ? data.byStatus : NO_DATA}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
              >
                {(data.byStatus.length ? data.byStatus : NO_DATA).map((entry, i) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Resolved vs unresolved" subtitle="Overall completion snapshot">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.resolvedVsUnresolved} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                <Cell fill="#16a34a" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department workloads" subtitle="Open and assigned complaints per department">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byDepartment.length ? data.byDepartment : NO_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
              <Tooltip />
              <Bar dataKey="value" name="Complaints" fill="#16a34a" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority mix" subtitle="Auto-suggested and admin-overridden priorities">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.byPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={26} />
              <Tooltip />
              <Line type="monotone" dataKey="value" name="Complaints" stroke="#e11d48" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <p className="text-xs text-slate-400">
        Avg. resolution time: {data.averageResolutionHours != null ? `${data.averageResolutionHours} hours` : 'not enough data yet'}.
        All figures come from actual records in the database.
      </p>
    </div>
  );
}