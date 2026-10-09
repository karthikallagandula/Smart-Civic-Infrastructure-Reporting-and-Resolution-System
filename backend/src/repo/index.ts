import {
  AdminReportQuery,
  NotificationRecord,
  ReportRecord,
  Role,
  StatusHistoryRecord,
  UserRecord,
} from '../types';

export interface NewUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface Repo {
  mode: 'mongo' | 'demo';

  // Users
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  listUsersByRole(role: Role): Promise<UserRecord[]>;
  createUser(input: NewUserInput): Promise<UserRecord>;

  // Reports
  nextComplaintSeq(): Promise<number>;
  createReport(report: Omit<ReportRecord, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>): Promise<ReportRecord>;
  getReport(id: string): Promise<ReportRecord | null>;
  listReportsByCitizen(citizenId: string): Promise<ReportRecord[]>;
  listReportsFiltered(query: AdminReportQuery): Promise<ReportRecord[]>;
  allReports(): Promise<ReportRecord[]>;
  updateReport(id: string, patch: Partial<ReportRecord>): Promise<ReportRecord | null>;

  // Status history
  addHistory(entry: Omit<StatusHistoryRecord, 'id' | 'timestamp'>): Promise<StatusHistoryRecord>;
  listHistory(reportId: string): Promise<StatusHistoryRecord[]>;

  // Notifications
  createNotification(
    entry: Omit<NotificationRecord, 'id' | 'createdAt' | 'read'>
  ): Promise<NotificationRecord>;
  listNotifications(userId: string): Promise<NotificationRecord[]>;
  markNotificationRead(id: string, userId: string): Promise<NotificationRecord | null>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

let repo: Repo | null = null;

export function setRepo(instance: Repo): void {
  repo = instance;
}

export function getRepo(): Repo {
  if (!repo) throw new Error('Repository has not been initialised');
  return repo;
}
