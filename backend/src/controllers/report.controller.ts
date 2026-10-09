import { Request, Response, NextFunction } from 'express';
import { getRepo } from '../repo';
import { reportCreateSchema } from '../validators/schemas';
import { forbidden, notFound } from '../utils/errors';
import { complaintIdFor } from '../utils/helpers';
import { suggestDepartment, suggestPriority } from '../services/priority';
import { saveImage } from '../services/storage';
import { ReportRecord, Status } from '../types';

function canView(report: ReportRecord, userId: string, role: string): boolean {
  return role === 'admin' || report.citizenId === userId;
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const input = reportCreateSchema.parse(req.body);
    const repo = getRepo();
    const user = req.user!;

    let imageUrl: string | null = null;
    let imageStorage: ReportRecord['imageStorage'] = 'none';
    if (req.file) {
      const saved = await saveImage(req.file.buffer, req.file.mimetype, 'reports');
      imageUrl = saved.url;
      imageStorage = saved.storage;
    }

    const priorityInfo = suggestPriority({
      category: input.category,
      severity: input.severity,
      title: input.title,
      description: input.description,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    });

    const seq = await repo.nextComplaintSeq();
    const complaintId = complaintIdFor(seq);

    const report = await repo.createReport({
      complaintId,
      citizenId: user.id,
      citizenName: user.name,
      category: input.category,
      title: input.title,
      description: input.description,
      imageUrl,
      imageStorage,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      address: input.address || '',
      severity: input.severity,
      priority: priorityInfo.priority,
      priorityReason: priorityInfo.reason,
      prioritySource: 'auto',
      status: 'pending' as Status,
      department: suggestDepartment(input.category),
      team: '',
      resolutionImageUrl: null,
      resolutionNote: '',
      isDemo: repo.mode === 'demo',
    });

    await repo.addHistory({
      reportId: report.id,
      previousStatus: null,
      newStatus: 'pending',
      changedById: user.id,
      changedByName: user.name,
      changedByRole: 'citizen',
      note: 'Complaint submitted by citizen.',
    });

    await repo.createNotification({
      userId: user.id,
      complaintId: report.complaintId,
      reportId: report.id,
      message: `Your complaint ${report.complaintId} — ${report.title} was submitted successfully.`,
      type: 'submitted',
    });

    const admins = await repo.listUsersByRole('admin');
    for (const admin of admins) {
      await repo.createNotification({
        userId: admin.id,
        complaintId: report.complaintId,
        reportId: report.id,
        message: `New complaint ${report.complaintId}: ${report.title} (${report.priority} priority).`,
        type: 'info',
      });
    }

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
}

export async function listMyReports(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const reports = await getRepo().listReportsByCitizen(user.id);
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const items = status ? reports.filter((r) => r.status === status) : reports;

    const summary = {
      total: reports.length,
      pending: reports.filter((r) => r.status === 'pending').length,
      assigned: reports.filter((r) => r.status === 'assigned').length,
      inProgress: reports.filter((r) => r.status === 'in_progress').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      highPriority: reports.filter((r) => r.priority === 'high' && r.status !== 'resolved').length,
    };

    res.json({ reports: items, summary });
  } catch (error) {
    next(error);
  }
}

export async function getMyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = getRepo();
    const report = await repo.getReport(req.params.id);
    if (!report) throw notFound('Complaint not found');
    if (!canView(report, req.user!.id, req.user!.role)) {
      throw forbidden('You can only view your own complaints');
    }
    const history = await repo.listHistory(report.id);
    res.json({ report, history });
  } catch (error) {
    next(error);
  }
}
