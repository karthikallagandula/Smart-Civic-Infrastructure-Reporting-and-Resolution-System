import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi, reportApi } from '../services/api';
import { Report } from '../types';
import { MapView } from '../components/MapView';
import { useGeolocation } from '../hooks/useGeolocation';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { Spinner } from '../components/Spinner';
import { ErrorState } from '../components/States';
import {
  CATEGORY_LABELS,
  CATEGORIES,
  PRIORITIES,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUSES,
  formatCoords,
} from '../utils/constants';
import { reportDetailPath } from '../utils/paths';
import { Category, Priority, Status } from '../types';

export function MapPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');

  const { position, request } = useGeolocation();
  useEffect(() => {
    if (!isAdmin) void request();
  }, [isAdmin, request]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const data = await adminApi.list({
          limit: 100,
          category: category === 'all' ? undefined : category,
          status: status === 'all' ? undefined : status,
          priority: priority === 'all' ? undefined : priority,
        });
        setReports(data.items);
      } else {
        const data = await reportApi.mine();
        setReports(data.reports);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the map.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, category, status, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  const withLocation = reports.filter((r) => r.latitude != null && r.longitude != null);
  const withoutLocation = reports.length - withLocation.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Complaints map</h1>
          <p className="mt-1 text-sm text-slate-500">
            {withLocation.length} complaint{withLocation.length === 1 ? '' : 's'} with a reported location
            {withoutLocation > 0 ? ` · ${withoutLocation} without coordinates` : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-slate-400" /> OpenStreetMap
          </span>
          <span className="hidden items-center gap-3 sm:flex">
            {PRIORITIES.map((p) => (
              <span key={p} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
                {PRIORITY_LABELS[p]}
              </span>
            ))}
          </span>
        </div>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'all')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | 'all')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | 'all')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {loading ? (
        <Spinner label="Loading map…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <MapView reports={reports} height="540px" userLocation={position} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> Markers show the exact reported coordinates. Select a marker to
            preview it, then open the full complaint.
          </p>
        </div>
      )}
    </div>
  );
}