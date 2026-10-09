import { ReportRecord } from '../types';
import { dayKey, titleCase } from '../utils/helpers';
import { CATEGORY_LABELS } from './priority';

export interface Analytics {
  generatedAt: string;
  totalReports: number;
  byStatus: { name: string; value: number }[];
  byCategory: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  byDepartment: { name: string; value: number }[];
  overTime: { date: string; submitted: number; resolved: number }[];
  resolvedVsUnresolved: { name: string; value: number }[];
  highPriorityOpen: number;
  resolutionRate: number;
  averageResolutionHours: number | null;
  recent: ReportRecord[];
}

export function computeAnalytics(reports: ReportRecord[]): Analytics {
  const total = reports.length;
  const countBy = (key: keyof ReportRecord) => {
    const map = new Map<string, number>();
    for (const r of reports) {
      const v = String(r[key] ?? 'unknown');
      map.set(v, (map.get(v) || 0) + 1);
    }
    return map;
  };

  const statusMap = countBy('status');
  const categoryMap = countBy('category');
  const priorityMap = countBy('priority');
  const departmentMap = countBy('department');

  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dayKey(new Date(Date.now() - i * 86400000).toISOString()));
  }
  const submittedByDay = new Map<string, number>();
  const resolvedByDay = new Map<string, number>();
  for (const r of reports) {
    const created = dayKey(r.createdAt);
    submittedByDay.set(created, (submittedByDay.get(created) || 0) + 1);
    if (r.resolvedAt) {
      const resolved = dayKey(r.resolvedAt);
      resolvedByDay.set(resolved, (resolvedByDay.get(resolved) || 0) + 1);
    }
  }
  const overTime = days.map((date) => ({
    date: date.slice(5),
    submitted: submittedByDay.get(date) || 0,
    resolved: resolvedByDay.get(date) || 0,
  }));

  const resolvedCount = statusMap.get('resolved') || 0;
  const openCount = total - resolvedCount;

  const resolutionTimes: number[] = [];
  for (const r of reports) {
    if (r.resolvedAt) {
      const ms = new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime();
      if (ms > 0) resolutionTimes.push(ms / 3600000);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalReports: total,
    byStatus: ['pending', 'assigned', 'in_progress', 'resolved'].map((s) => ({
      name: titleCase(s),
      value: statusMap.get(s) || 0,
    })),
    byCategory: [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] || titleCase(k), value: v })),
    byPriority: ['high', 'medium', 'low'].map((p) => ({ name: titleCase(p), value: priorityMap.get(p) || 0 })),
    byDepartment: [...departmentMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ name: k || 'Unassigned', value: v })),
    overTime,
    resolvedVsUnresolved: [
      { name: 'Resolved', value: resolvedCount },
      { name: 'Open', value: openCount },
    ],
    highPriorityOpen: reports.filter((r) => r.priority === 'high' && r.status !== 'resolved').length,
    resolutionRate: total === 0 ? 0 : Math.round((resolvedCount / total) * 100),
    averageResolutionHours:
      resolutionTimes.length === 0
        ? null
        : Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10,
    recent: [...reports]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 5),
  };
}
