import {
  Category,
  Priority,
  Severity,
  Status,
  CATEGORIES,
  PRIORITIES,
  SEVERITIES,
  STATUSES,
} from '../types';

export { CATEGORIES, PRIORITIES, SEVERITIES, STATUSES };
export type { Category, Priority, Severity, Status };

export const CATEGORY_LABELS: Record<Category, string> = {
  pothole: 'Pothole',
  road_damage: 'Road Damage',
  streetlight: 'Broken Streetlight',
  manhole: 'Open / Damaged Manhole',
  water_leakage: 'Water Pipeline Leakage',
  drainage: 'Drainage Problem',
  other: 'Other Civic Infrastructure',
};

export const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const DEPARTMENTS = [
  'Roads Department',
  'Electrical Department',
  'Water Supply Department',
  'Sanitation & Drainage Department',
  'Urban Infrastructure Department',
];

export const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  pothole: 'Roads Department',
  road_damage: 'Roads Department',
  streetlight: 'Electrical Department',
  water_leakage: 'Water Supply Department',
  manhole: 'Sanitation & Drainage Department',
  drainage: 'Sanitation & Drainage Department',
  other: 'Urban Infrastructure Department',
};

export const STATUS_FLOW: Status[] = ['pending', 'assigned', 'in_progress', 'resolved'];

export const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  assigned: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  resolved: 'bg-accent-100 text-accent-700 ring-accent-500/30',
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'bg-rose-50 text-rose-700 ring-rose-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e11d48',
  medium: '#f59e0b',
  low: '#64748b',
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(iso);
}

export function formatCoords(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return 'Location not provided';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
