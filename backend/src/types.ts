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

export const ROLES = ['citizen', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface ReportRecord {
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

export interface StatusHistoryRecord {
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

export interface NotificationRecord {
  id: string;
  userId: string;
  complaintId: string;
  reportId: string;
  message: string;
  type: 'submitted' | 'assigned' | 'status' | 'resolved' | 'info';
  read: boolean;
  createdAt: string;
}

export type ReportInput = Omit<
  ReportRecord,
  'id' | 'complaintId' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'status' | 'department' | 'team' | 'resolutionImageUrl' | 'resolutionNote' | 'prioritySource'
>;

export interface AdminReportQuery {
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
