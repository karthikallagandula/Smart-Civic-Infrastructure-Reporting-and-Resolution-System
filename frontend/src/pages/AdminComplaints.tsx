import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, ClipboardList, Eye, Search, X } from 'lucide-react';
import { adminApi, AdminListQuery } from '../services/api';
import { Category, Priority, Report, Status } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { Pagination } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { EmptyState, ErrorState } from '../components/States';
import { CATEGORY_LABELS, CATEGORIES, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS, formatDate, formatCoords, timeAgo } from '../utils/constants';
import { reportDetailPath } from '../utils/paths';

const STATUS_FILTER: ReadonlyArray<Status | 'all'> = ['all', ...STATUSES];
const PRIORITY_FILTER: ReadonlyArray<Priority | 'all'> = ['all', ...PRIORITIES];
const CATEGORY_FILTER: ReadonlyArray<Category | 'all'> = ['all', ...CATEGORIES];

type SortKey = 'createdAt' | 'complaintId' | 'title' | 'category' | 'status';

export function AdminComplaints() {
  const [query, setQuery] = useState<AdminListQuery>({ page: 1, limit: 10, sort: 'createdAt', order: 'desc' });
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<{ pending: number; total: number }>({ pending: 0, total: 0 });
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(
    async (q: AdminListQuery) => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.list(q);
        setReports(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setSummary({ pending: data.summary.pending, total: data.summary.total });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load complaints.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load({ ...query, q: debouncedSearch || undefined, page: 1 });
  }, [load, query, debouncedSearch]);

  useEffect(() => {
    void adminApi.list({ limit: 1 }).then((d) => setTotalAll(d.summary.total)).catch(() => undefined);
  }, []);

  const updateFilter = (patch: Partial<AdminListQuery>) =>
    setQuery((prev) => ({ ...prev, ...patch, page: 1 }));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      const nextOrder = order === 'asc' ? 'desc' : 'asc';
      setOrder(nextOrder);
      setQuery((prev) => ({ ...prev, sort: key, order: nextOrder, page: 1 }));
    } else {
      setSortKey(key);
      setOrder('asc');
      setQuery((prev) => ({ ...prev, sort: key, order: 'asc', page: 1 }));
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    query.sort === col ? (query.order === 'asc' ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />) : null;

  const FilterSelect = ({
    value,
    onChange,
    label,
    options,
    filterKey,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    filterKey: 'category' | 'status' | 'priority';
    options: { value: string; label: string }[];
  }) => (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          updateFilter(v === 'all' ? { [filterKey]: undefined } : { [filterKey]: v });
        }}
        className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );

  const activeFilters = [query.category ?? 'all', query.status ?? 'all', query.priority ?? 'all'].filter((v) => v !== 'all').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Complaint management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalAll} total reports · {summary.pending} pending · {reports.length} shown
          </p>
        </div>
        <Link
          to="/admin/map"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" /> View on map
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by complaint ID, title, description or address…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-8 text-sm outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Category"
            filterKey="category"
            value={query.category || 'all'}
            onChange={(v) => updateFilter(v === 'all' ? { category: undefined } : { category: v })}
            options={[
              { value: 'all', label: 'All categories' },
              ...CATEGORY_FILTER.filter((c) => c !== 'all').map((c) => ({
                value: c,
                label: CATEGORY_LABELS[c as Category],
              })),
            ]}
          />
          <FilterSelect
            label="Status"
            filterKey="status"
            value={query.status || 'all'}
            onChange={(v) => updateFilter(v === 'all' ? { status: undefined } : { status: v })}
            options={[
              { value: 'all', label: 'All statuses' },
              ...STATUS_FILTER.filter((s) => s !== 'all').map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
          <FilterSelect
            label="Priority"
            filterKey="priority"
            value={query.priority || 'all'}
            onChange={(v) => updateFilter(v === 'all' ? { priority: undefined } : { priority: v })}
            options={[
              { value: 'all', label: 'All priorities' },
              ...PRIORITY_FILTER.filter((p) => p !== 'all').map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
            ]}
          />
          <button
            onClick={() => setQuery({ page: 1, limit: 10, sort: 'createdAt', order: 'desc' })}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <X className="h-3.5 w-3.5" /> Clear ({activeFilters})
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading complaints…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(query)} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No complaints match"
          message="Try clearing filters or search. New citizen reports will appear here automatically."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {(
                    [
                      ['complaintId', 'Complaint ID'],
                      ['category', 'Category'],
                      ['title', 'Title'],
                      ['', 'Location'],
                      ['status', 'Status'],
                      ['', 'Priority'],
                      ['createdAt', 'Submitted'],
                      ['', 'Department'],
                      ['', 'Actions'],
                    ] as [SortKey | '', string][]
                  ).map(([key, label]) => (
                    <th
                      key={label}
                      className="cursor-pointer px-3 py-3 font-semibold first:pl-4"
                      onClick={key ? () => toggleSort(key) : undefined}
                    >
                      {label}
                      <SortIcon col={key as SortKey} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-3 py-3 font-mono text-xs font-bold text-navy-700 first:pl-4">
                      {report.complaintId}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{CATEGORY_LABELS[report.category]}</td>
                    <td className="max-w-[220px] px-3 py-3">
                      <p className="truncate font-medium text-slate-800">{report.title}</p>
                      <p className="truncate text-xs text-slate-400">{report.address || formatCoords(report.latitude, report.longitude)}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {report.latitude != null ? `${report.latitude.toFixed(4)}, ${report.longitude?.toFixed(4)}` : 'No GPS'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={report.priority} suggested={report.prioritySource === 'auto'} />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500" title={formatDate(report.createdAt)}>
                      {timeAgo(report.createdAt)}
                    </td>
                    <td className="max-w-[150px] px-3 py-3 text-xs text-slate-600">
                      <span className="line-clamp-2">{report.department || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to={reportDetailPath(report.id, 'admin')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-3">
            <Pagination
              page={query.page || 1}
              totalPages={totalPages}
              total={total}
              onPage={(page) => setQuery((prev) => ({ ...prev, page }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}