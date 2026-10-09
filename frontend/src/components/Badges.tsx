import { Priority, Status } from '../types';
import { PRIORITY_LABELS, PRIORITY_STYLES, STATUS_LABELS, STATUS_STYLES } from '../utils/constants';

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority, suggested }: { priority: Priority; suggested?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${PRIORITY_STYLES[priority]}`}
      title={suggested ? 'Automatically suggested priority — reviewable by an administrator' : 'Priority set by administrator'}
    >
      {PRIORITY_LABELS[priority]}
      {suggested ? <span className="font-normal opacity-70">(auto)</span> : null}
    </span>
  );
}
