export const CATEGORIES = [
  'pothole',
  'road_damage',
  'streetlight',
  'manhole',
  'water_leakage',
  'drainage',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ['pending', 'assigned', 'in_progress', 'resolved'] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SEVERITIES = ['low', 'medium', 'high'] as const;
export type Severity = (typeof SEVERITIES)[number];

export type Role = 'citizen' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Report {
  id: string;
  complaintId: string;
  citizenId: string;
  citizenName: string;
  category: Category;
  title: string;
  description: string;
  imageUrl: string | null;
  imageStorage: 'cloudinary' | 'local-demo' | 'none';
  latitude: number | null;
  longitude: number | null;
  address: string;
  severity: Severity;
  priority: Priority;
  priorityReason: string;
  prioritySource: 'auto' | 'admin';
  status: Status;
  department: string;
  team: string;
  resolutionImageUrl: string | null;
  resolutionNote: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface HistoryEntry {
  id: string;
  reportId: string;
  previousStatus: Status | null;
  newStatus: Status;
  changedById: string;
  changedByName: string;
  changedByRole: Role;
  note: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  complaintId: string;
  reportId: string;
  message: string;
  type: 'submitted' | 'assigned' | 'status' | 'resolved' | 'info';
  read: boolean;
  createdAt: string;
}

export interface DuplicateMatch {
  report: Report;
  distanceMeters: number | null;
  reason: string;
  score: number;
}

export interface Summary {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  departments?: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: Summary;
}

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
  recent: Report[];
}

export interface HealthInfo {
  status: string;
  demoMode: boolean;
  notice: string;
  uploadMode: 'cloudinary' | 'local-demo';
  aiEnabled: boolean;
  demoAccounts?: { role: string; email: string; password: string }[];
  timestamp: string;
}

export interface ApiErrorShape {
  status: number;
  message: string;
  details?: { path: string; message: string }[];
}
