import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { HistoryEntry, Status } from '../types';
import { STATUS_FLOW, STATUS_LABELS, formatDateTime } from '../utils/constants';

const NOTE_TONE: Record<string, string> = {
  resolved: 'text-accent-700',
  in_progress: 'text-indigo-700',
  assigned: 'text-sky-700',
  pending: 'text-amber-700',
};

export function StatusTimeline({ history, currentStatus }: { history: HistoryEntry[]; currentStatus: Status }) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap items-center gap-2">
        {STATUS_FLOW.map((status, index) => {
          const reached = index <= currentIndex;
          const isCurrent = status === currentStatus;
          return (
            <li key={status} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isCurrent
                    ? 'bg-navy-900 text-white'
                    : reached
                      ? 'bg-accent-100 text-accent-700'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {reached ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {STATUS_LABELS[status]}
              </span>
              {index < STATUS_FLOW.length - 1 ? (
                <span className={`hidden h-px w-6 sm:block ${reached ? 'bg-accent-500' : 'bg-slate-200'}`} />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="relative space-y-4 border-l-2 border-slate-200 pl-5">
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No status updates recorded yet.</p>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="relative">
              <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-navy-700">
                <Clock className="h-2.5 w-2.5 text-white" />
              </span>
              <p className={`text-sm font-semibold ${NOTE_TONE[entry.newStatus] || 'text-slate-700'}`}>
                {entry.previousStatus
                  ? `${STATUS_LABELS[entry.previousStatus]} → ${STATUS_LABELS[entry.newStatus]}`
                  : `Complaint ${STATUS_LABELS[entry.newStatus]}`}
              </p>
              {entry.note ? <p className="mt-0.5 text-sm text-slate-600">{entry.note}</p> : null}
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDateTime(entry.timestamp)} · by {entry.changedByName} ({entry.changedByRole})
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
