import {
  Analytics,
  ApiErrorShape,
  DuplicateMatch,
  HealthInfo,
  HistoryEntry,
  Notification,
  Page,
  Priority,
  Report,
  Status,
  Summary,
  User,
} from '../types';

const TOKEN_KEY = 'civicconnect_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  details?: { path: string; message: string }[];
  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !options.formData) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.formData ? options.formData : options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const payload = data as { error?: string; details?: { path: string; message: string }[] } | null;
    throw new ApiError(
      response.status,
      payload?.error || `Request failed (${response.status})`,
      payload?.details
    );
  }

  return data as T;
}

/* -------------------------------- Auth ---------------------------------- */
export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: input }),
  login: (input: { email: string; password: string }) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: input }),
  me: () => api<{ user: User }>('/auth/me'),
};

/* ------------------------------- Reports -------------------------------- */
export const reportApi = {
  create: (formData: FormData) => api<{ report: Report }>('/reports', { method: 'POST', formData }),
  mine: (status?: string) => api<{ reports: Report[]; summary: Summary }>(`/reports/my${status ? `?status=${status}` : ''}`),
  get: (id: string) => api<{ report: Report; history: HistoryEntry[] }>(`/reports/${id}`),
};

/* -------------------------------- Admin --------------------------------- */
export interface AdminListQuery {
  q?: string;
  category?: string;
  status?: string;
  priority?: string;
  department?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

function queryToParams(query: AdminListQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const adminApi = {
  list: (query: AdminListQuery = {}) => api<Page<Report>>(`/admin/reports${queryToParams(query)}`),
  get: (id: string) =>
    api<{ report: Report; history: HistoryEntry[]; duplicates: DuplicateMatch[]; nextStatuses: Status[] }>(
      `/admin/reports/${id}`
    ),
  updateStatus: (id: string, formData: FormData) =>
    api<{ report: Report }>(`/admin/reports/${id}/status`, { method: 'PATCH', formData }),
  assign: (id: string, input: { department: string; team?: string }) =>
    api<{ report: Report; statusChanged: boolean }>(`/admin/reports/${id}/assign`, {
      method: 'PATCH',
      body: input,
    }),
  setPriority: (id: string, input: { priority: Priority; reason?: string }) =>
    api<{ report: Report }>(`/admin/reports/${id}/priority`, { method: 'PATCH', body: input }),
  analytics: () => api<Analytics>('/admin/analytics'),
};

/* ----------------------------- Notifications ---------------------------- */
export const notificationApi = {
  list: () => api<{ notifications: Notification[]; unread: number }>('/notifications'),
  markRead: (id: string) => api<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api<{ ok: boolean }>('/notifications/read-all', { method: 'PATCH' }),
};

/* ------------------------------- AI (optional) -------------------------- */
export interface CategorySuggestion {
  suggestedCategory: import('../types').Category;
  confidence: number | null;
  source: 'ai' | 'keyword-fallback';
  note: string;
  aiEnabled: boolean;
}

export interface TextAssist {
  title: string;
  description: string;
  source: 'ai' | 'rule-fallback';
  note: string;
  aiEnabled: boolean;
}

export const aiApi = {
  analyzeImage: (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api<CategorySuggestion>('/ai/analyze-image', { method: 'POST', formData: fd });
  },
  assistText: (text: string) => api<TextAssist>('/ai/assist-text', { method: 'POST', body: { text } }),
};

/* -------------------------------- Health -------------------------------- */
export const healthApi = {
  get: () => api<HealthInfo>('/health'),
};
