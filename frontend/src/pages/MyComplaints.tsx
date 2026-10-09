import { useEffect, useState } from 'react';
import { FileText, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reportApi } from '../services/api';
import { Report, Status } from '../types';
import { STATUSES, STATUS_LABELS } from '../utils/constants';
import { ComplaintCard } from '../components/ComplaintCard';
import { EmptyState } from '../components/States';
import { Spinner } from '../components/Spinner';

type Filter = 'all' | Status;

export function MyComplaints() {
  const [filter, setFilter] = useState<Filter>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void reportApi
      .mine()
      .then((data) => {
        setAllReports(data.reports);
        setReports(data.reports);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setReports(filter === 'all' ? allReports : allReports.filter((r) => r.status === filter));
  }, [filter, allReports]);

  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: allReports.length },
    ...STATUSES.map((status) => ({
      value: status as Filter,
      label: STATUS_LABELS[status],
      count: allReports.filter((r) => r.status === status).length,
    })),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My complaints</h1>
        <p className="mt-1 text-sm text-slate-500">Track everything you have reported to the authority.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === tab.value
                ? 'bg-navy-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-[10px] ${filter === tab.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading your complaints…" />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filter === 'all' ? 'No complaints yet' : `No ${STATUS_LABELS[filter as Status].toLowerCase()} complaints`}
          message={
            filter === 'all'
              ? 'Report damaged public infrastructure to start tracking it here.'
              : 'Nothing matches this filter right now.'
          }
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
          {reports.map((report) => (
            <ComplaintCard key={report.id} report={report} role="citizen" />
          ))}
        </div>
      )}
    </div>
  );
}