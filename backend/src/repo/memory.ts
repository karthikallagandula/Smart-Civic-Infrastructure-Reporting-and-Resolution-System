import crypto from 'crypto';
import {
  AdminReportQuery,
  NotificationRecord,
  ReportRecord,
  Role,
  StatusHistoryRecord,
  UserRecord,
} from '../types';
import { escapeRegex, paginate } from '../utils/helpers';
import { NewUserInput, Repo } from './index';

function id(): string {
  return crypto.randomBytes(12).toString('hex');
}

export function createMemoryRepo(seed?: {
  users?: UserRecord[];
  reports?: ReportRecord[];
  history?: StatusHistoryRecord[];
  notifications?: NotificationRecord[];
  seq?: number;
}): Repo {
  const users: UserRecord[] = seed?.users ? [...seed.users] : [];
  const reports: ReportRecord[] = seed?.reports ? [...seed.reports] : [];
  const history: StatusHistoryRecord[] = seed?.history ? [...seed.history] : [];
  const notifications: NotificationRecord[] = seed?.notifications ? [...seed.notifications] : [];
  let seq = seed?.seq ?? 0;

  const repo: Repo = {
    mode: 'demo',

    async findUserByEmail(email) {
      const lower = email.toLowerCase();
      return users.find((u) => u.email.toLowerCase() === lower) || null;
    },
    async findUserById(userId) {
      return users.find((u) => u.id === userId) || null;
    },
    async listUsersByRole(role) {
      return users.filter((u) => u.role === role);
    },
    async createUser(input: NewUserInput) {
      const user: UserRecord = {
        id: id(),
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      return user;
    },

    async nextComplaintSeq() {
      seq += 1;
      return seq;
    },
    async createReport(report) {
      const now = new Date().toISOString();
      const record: ReportRecord = {
        ...report,
        id: id(),
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
      };
      reports.push(record);
      return record;
    },
    async getReport(reportId) {
      return (
        reports.find((r) => r.id === reportId || r.complaintId === reportId) || null
      );
    },
    async listReportsByCitizen(citizenId) {
      return reports.filter((r) => r.citizenId === citizenId);
    },
    async listReportsFiltered(query: AdminReportQuery) {
      let items = [...reports];
      if (query.category) items = items.filter((r) => r.category === query.category);
      if (query.status) items = items.filter((r) => r.status === query.status);
      if (query.priority) items = items.filter((r) => r.priority === query.priority);
      if (query.department) items = items.filter((r) => r.department === query.department);
      if (query.from) {
        const from = new Date(query.from).getTime();
        items = items.filter((r) => new Date(r.createdAt).getTime() >= from);
      }
      if (query.to) {
        const to = new Date(query.to).getTime() + 86400000;
        items = items.filter((r) => new Date(r.createdAt).getTime() < to);
      }
      if (query.q && query.q.trim()) {
        const re = new RegExp(escapeRegex(query.q.trim()), 'i');
        items = items.filter(
          (r) =>
            re.test(r.complaintId) ||
            re.test(r.title) ||
            re.test(r.description) ||
            re.test(r.address) ||
            re.test(r.citizenName)
        );
      }
      return items;
    },
    async allReports() {
      return [...reports];
    },
    async updateReport(reportId, patch) {
      const index = reports.findIndex((r) => r.id === reportId);
      if (index === -1) return null;
      reports[index] = {
        ...reports[index],
        ...patch,
        id: reports[index].id,
        updatedAt: new Date().toISOString(),
      };
      return reports[index];
    },

    async addHistory(entry) {
      const record: StatusHistoryRecord = {
        ...entry,
        id: id(),
        timestamp: new Date().toISOString(),
      };
      history.push(record);
      return record;
    },
    async listHistory(reportId) {
      return history
        .filter((h) => h.reportId === reportId)
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    },

    async createNotification(entry) {
      const record: NotificationRecord = {
        ...entry,
        id: id(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      notifications.push(record);
      return record;
    },
    async listNotifications(userId) {
      return notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    async markNotificationRead(noteId, userId) {
      const record = notifications.find((n) => n.id === noteId && n.userId === userId);
      if (!record) return null;
      record.read = true;
      return record;
    },
    async markAllNotificationsRead(userId) {
      notifications.forEach((n) => {
        if (n.userId === userId) n.read = true;
      });
    },
  };

  return repo;
}

export { paginate };
