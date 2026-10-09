export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function complaintIdFor(seq: number, date = new Date()): string {
  const year = date.getFullYear();
  return `CC-${year}-${String(seq).padStart(4, '0')}`;
}

export function titleCase(value: string): string {
  return value
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function withinDays(iso: string, days: number): boolean {
  const time = new Date(iso).getTime();
  return time >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function paginate<T extends Record<string, any>>(
  items: T[],
  opts: { sort?: string; order?: 'asc' | 'desc'; page?: number; limit?: number }
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 10));
  const sortKey = opts.sort || 'createdAt';
  const dir = opts.order === 'asc' ? 1 : -1;
  const sorted = [...items].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  return { items: sorted.slice(start, start + limit), total, page: safePage, limit, totalPages };
}
