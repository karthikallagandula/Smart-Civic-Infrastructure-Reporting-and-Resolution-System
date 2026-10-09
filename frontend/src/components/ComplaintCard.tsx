import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Report, Role } from '../types';
import { PriorityBadge, StatusBadge } from './Badges';
import { CATEGORY_LABELS, formatDate, formatCoords } from '../utils/constants';
import { reportDetailPath } from '../utils/paths';

export function ComplaintCard({ report, role }: { report: Report; role: Role }) {
  return (
    <Link
      to={reportDetailPath(report.id, role)}
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-navy-300 hover:shadow-md sm:flex-row sm:items-center"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {report.imageUrl ? (
          <img src={report.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <MapPin className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-navy-700">{report.complaintId}</span>
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} suggested={report.prioritySource === 'auto'} />
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold text-slate-800">{report.title}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {CATEGORY_LABELS[report.category]} · {report.address || formatCoords(report.latitude, report.longitude)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span className="text-xs text-slate-400">{formatDate(report.createdAt)}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 group-hover:text-navy-900">
          View <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
