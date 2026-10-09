import mongoose, { Schema, Document } from 'mongoose';
import {
  AdminReportQuery,
  NotificationRecord,
  ReportRecord,
  Role,
  StatusHistoryRecord,
  UserRecord,
} from '../types';
import { escapeRegex } from '../utils/helpers';
import { NewUserInput, Repo } from './index';

/* ------------------------------- Schemas ------------------------------- */

interface UserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  },
  { timestamps: true }
);

interface ReportDoc extends Document {
  complaintId: string;
  citizenId: string;
  citizenName: string;
  category: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageStorage: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  severity: string;
  priority: string;
  priorityReason: string;
  prioritySource: string;
  status: string;
  department: string;
  team: string;
  resolutionImageUrl: string | null;
  resolutionNote: string;
  isDemo: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<ReportDoc>(
  {
    complaintId: { type: String, required: true, unique: true, index: true },
    citizenId: { type: String, required: true, index: true },
    citizenName: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 3000 },
    imageUrl: { type: String, default: null },
    imageStorage: { type: String, default: 'none' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: '', maxlength: 240 },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    priority: { type: String, enum: ['high', 'medium', 'low'], index: true },
    priorityReason: { type: String, default: '' },
    prioritySource: { type: String, enum: ['auto', 'admin'], default: 'auto' },
    status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'resolved'], default: 'pending', index: true },
    department: { type: String, default: '' },
    team: { type: String, default: '' },
    resolutionImageUrl: { type: String, default: null },
    resolutionNote: { type: String, default: '' },
    isDemo: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ title: 'text', description: 'text', complaintId: 'text' });

interface HistoryDoc extends Document {
  reportId: string;
  previousStatus: string | null;
  newStatus: string;
  changedById: string;
  changedByName: string;
  changedByRole: Role;
  note: string;
  timestamp: Date;
}

const historySchema = new Schema<HistoryDoc>(
  {
    reportId: { type: String, required: true, index: true },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, required: true },
    changedById: { type: String, default: '' },
    changedByName: { type: String, default: '' },
    changedByRole: { type: String, default: 'admin' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

interface NotificationDoc extends Document {
  userId: string;
  complaintId: string;
  reportId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: String, required: true, index: true },
    complaintId: { type: String, default: '' },
    reportId: { type: String, default: '' },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interface CounterDoc extends Document {
  seq: number;
}
const counterSchema = new Schema<CounterDoc>({ _id: String, seq: Number });

const UserModel = mongoose.model<UserDoc>('User', userSchema);
const ReportModel = mongoose.model<ReportDoc>('Report', reportSchema);
const HistoryModel = mongoose.model<HistoryDoc>('StatusHistory', historySchema);
const NotificationModel = mongoose.model<NotificationDoc>('Notification', notificationSchema);
const CounterModel = mongoose.model<CounterDoc>('Counter', counterSchema);

/* ------------------------------- Mapping ------------------------------- */

function toRecord<T extends { id: string }>(doc: any): T {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id' || key === '__v') continue;
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  out.id = String(obj._id);
  return out as unknown as T;
}

/* -------------------------------- Repo --------------------------------- */

export function createMongoRepo(): Repo {
  return {
    mode: 'mongo',

    async findUserByEmail(email) {
      const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      return doc ? toRecord<UserRecord>({ ...doc, _id: doc._id }) : null;
    },
    async findUserById(userId) {
      if (!mongoose.isValidObjectId(userId)) return null;
      const doc = await UserModel.findById(userId).lean();
      return doc ? toRecord<UserRecord>(doc) : null;
    },
    async listUsersByRole(role) {
      const docs = await UserModel.find({ role }).lean();
      return docs.map((d) => toRecord<UserRecord>(d));
    },
    async createUser(input) {
      const created = await UserModel.create({ ...input, email: input.email.toLowerCase() });
      return toRecord<UserRecord>(created);
    },

    async nextComplaintSeq() {
      const year = String(new Date().getFullYear());
      const counter = await CounterModel.findOneAndUpdate(
        { _id: year },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      ).lean();
      return counter?.seq ?? 1;
    },
    async createReport(report) {
      const created = await ReportModel.create(report);
      return toRecord<ReportRecord>(created);
    },
    async getReport(reportId) {
      if (!mongoose.isValidObjectId(reportId)) {
        const byCode = await ReportModel.findOne({ complaintId: reportId }).lean();
        return byCode ? toRecord<ReportRecord>(byCode) : null;
      }
      const doc = await ReportModel.findById(reportId).lean();
      return doc ? toRecord<ReportRecord>(doc) : null;
    },
    async listReportsByCitizen(citizenId) {
      const docs = await ReportModel.find({ citizenId })
        .sort({ createdAt: -1 })
        .lean();
      return docs.map((d) => toRecord<ReportRecord>(d));
    },
    async listReportsFiltered(query: AdminReportQuery) {
      const filter: Record<string, unknown> = {};
      if (query.category) filter.category = query.category;
      if (query.status) filter.status = query.status;
      if (query.priority) filter.priority = query.priority;
      if (query.department) filter.department = query.department;
      if (query.from || query.to) {
        const range: Record<string, Date> = {};
        if (query.from) range.$gte = new Date(query.from);
        if (query.to) range.$lte = new Date(new Date(query.to).getTime() + 86400000);
        filter.createdAt = range;
      }
      if (query.q && query.q.trim()) {
        const re = new RegExp(escapeRegex(query.q.trim()), 'i');
        filter.$or = [
          { complaintId: re },
          { title: re },
          { description: re },
          { address: re },
          { citizenName: re },
        ];
      }
      const docs = await ReportModel.find(filter).lean();
      return docs.map((d) => toRecord<ReportRecord>(d));
    },
    async allReports() {
      const docs = await ReportModel.find().lean();
      return docs.map((d) => toRecord<ReportRecord>(d));
    },
    async updateReport(reportId, patch) {
      if (!mongoose.isValidObjectId(reportId)) return null;
      const doc = await ReportModel.findByIdAndUpdate(
        reportId,
        { $set: patch },
        { new: true }
      ).lean();
      return doc ? toRecord<ReportRecord>(doc) : null;
    },

    async addHistory(entry) {
      const created = await HistoryModel.create({
        ...entry,
        timestamp: new Date(),
      });
      return toRecord<StatusHistoryRecord>(created);
    },
    async listHistory(reportId) {
      const docs = await HistoryModel.find({ reportId }).sort({ timestamp: -1 }).lean();
      return docs.map((d) => toRecord<StatusHistoryRecord>(d));
    },

    async createNotification(entry) {
      const created = await NotificationModel.create({ ...entry, read: false });
      return toRecord<NotificationRecord>(created);
    },
    async listNotifications(userId) {
      const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
      return docs.map((d) => toRecord<NotificationRecord>(d));
    },
    async markNotificationRead(noteId, userId) {
      if (!mongoose.isValidObjectId(noteId)) return null;
      const doc = await NotificationModel.findOneAndUpdate(
        { _id: noteId, userId },
        { $set: { read: true } },
        { new: true }
      ).lean();
      return doc ? toRecord<NotificationRecord>(doc) : null;
    },
    async markAllNotificationsRead(userId) {
      await NotificationModel.updateMany({ userId }, { $set: { read: true } });
    },
  };
}
