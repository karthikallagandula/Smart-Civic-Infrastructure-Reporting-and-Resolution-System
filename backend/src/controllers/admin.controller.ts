import { Request, Response, NextFunction } from 'express';
import { getRepo } from '../repo';
import {
  assignSchema,
  prioritySchema,
  reportListQuerySchema,
  statusUpdateSchema,
} from '../validators/schemas';
import { badRequest, notFound } from '../utils/errors';
import { paginate } from '../utils/helpers';
import { canTransition, allowedNextStatuses } from '../services/status';
import { computeAnalytics } from '../services/analytics';
import { saveImage } from '../services/storage';
import { findNearbyDuplicates } from '../services/duplicates';
import { ReportRecord, Status } from '../types';
import { titleCase } from '../utils/helpers';

export async function listAdminReports(req: Request, res: Response, next: NextFunction) {
  try {
    const query = reportListQuerySchema.parse(req.query);
    const repo = getRepo();
    const filtered = await repo.listReportsFiltered(query);
    const page = paginate(filtered, {
      sort: query.sort || 'createdAt',
      order: query.order || 'desc',
      page: query.page,
      limit: query.limit,
    });

    const all = filtered;
    const summary = {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      assigned: all.filter((r) => r.status === 'assigned').length,
      inProgress: all.filter((r) => r.status === 'in_progress').length,
      resolved: all.filter((r) => r.status === 'resolved').length,
      highPriority: all.filter((r) => r.priority === 'high').length,
      departments: [...new Set(all.map((r) => r.department).filter(Boolean))].sort(),
    };

    res.json({ ...page, summary });
  } catch (error) {
    next(error);
  }
}

export async function getAdminReport(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = getRepo();
    const report = await repo.getReport(req.params.id);
    if (!report) throw notFound('Complaint not found');
    const history = await repo.listHistory(report.id);
    const duplicates = await findNearbyDuplicates(report);
    res.json({ report, history, duplicates, nextStatuses: allowedNextStatuses(report.status) });
  } catch (error) {
    next(error);
  }
}

export async function updateReportStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const input = statusUpdateSchema.parse(req.body);
    const repo = getRepo();
    const user = req.user!;

    const report = await repo.getReport(req.params.id);
    if (!report) throw notFound('Complaint not found');

    if (report.status === input.status) {
      throw badRequest(`Complaint is already ${titleCase(input.status)}`);
    }
    if (!canTransition(report.status, input.status)) {
      throw badRequest(
        `Invalid status change: ${titleCase(report.status)} cannot move directly to ${titleCase(
          input.status
        )}. Allowed next states: ${allowedNextStatuses(report.status).map(titleCase).join(', ')}`
      );
    }

    let resolutionImageUrl = report.resolutionImageUrl;
    let imageStorageNote = '';
    if (input.status === 'resolved' && req.file) {
      const saved = await saveImage(req.file.buffer, req.file.mimetype, 'resolutions');
      resolutionImageUrl = saved.url;
      imageStorageNote = ` Resolution photo uploaded (${saved.storage === 'cloudinary' ? 'Cloudinary' : 'local demo storage'}).`;
    }

    const patch: Partial<ReportRecord> = {
      status: input.status,
      resolutionImageUrl,
      updatedAt: new Date().toISOString(),
    };

    if (input.status === 'assigned' && !report.department) {
      patch.department = '';
    }
    if (input.status === 'resolved') {
      if (!input.resolutionNote.trim() && !report.resolutionNote) {
        throw badRequest('A resolution note is required before marking a complaint as resolved');
      }
      patch.resolutionNote = input.resolutionNote || report.resolutionNote;
      patch.resolvedAt = new Date().toISOString();
    } else {
      if (input.note) patch.resolutionNote = report.resolutionNote;
      patch.resolvedAt = null;
    }

    const updated = await repo.updateReport(report.id, patch);
    if (!updated) throw notFound('Complaint not found');

    const note =
      input.status === 'resolved'
        ? `${input.resolutionNote || report.resolutionNote || 'Issue resolved.'}${imageStorageNote}`
        : input.note || `Status changed to ${titleCase(input.status)}.`;

    await repo.addHistory({
      reportId: report.id,
      previousStatus: report.status,
      newStatus: input.status,
      changedById: user.id,
      changedByName: user.name,
      changedByRole: 'admin',
      note,
    });

    const message =
      input.status === 'resolved'
        ? `Complaint ${report.complaintId} has been resolved.`
        : `Complaint ${report.complaintId} status updated to ${titleCase(input.status)}.`;
    await repo.createNotification({
      userId: report.citizenId,
      complaintId: report.complaintId,
      reportId: report.id,
      message,
      type: input.status === 'resolved' ? 'resolved' : 'status',
    });

    res.json({ report: updated });
  } catch (error) {
    next(error);
  }
}

export async function assignReport(req: Request, res: Response, next: NextFunction) {
  try {
    const input = assignSchema.parse(req.body);
    const repo = getRepo();
    const user = req.user!;

    const report = await repo.getReport(req.params.id);
    if (!report) throw notFound('Complaint not found');

    const patch: Partial<ReportRecord> = {
      department: input.department,
      team: input.team,
      updatedAt: new Date().toISOString(),
    };

    const updated = await repo.updateReport(report.id, patch);
    if (!updated) throw notFound('Complaint not found');

    let message: string;
    if (report.status === 'pending') {
      const statusPatch = await repo.updateReport(report.id, { status: 'assigned' as Status });
      await repo.addHistory({
        reportId: report.id,
        previousStatus: 'pending',
        newStatus: 'assigned',
        changedById: user.id,
        changedByName: user.name,
        changedByRole: 'admin',
        note: `Assigned to ${input.department}${input.team ? ` — team ${input.team}` : ''}.`,
      });
      message = `Complaint ${report.complaintId} has been assigned to ${input.department}.`;
      await repo.createNotification({
        userId: report.citizenId,
        complaintId: report.complaintId,
        reportId: report.id,
        message,
        type: 'assigned',
      });
      return res.json({ report: statusPatch || updated, statusChanged: true });
    }

    await repo.addHistory({
      reportId: report.id,
      previousStatus: report.status,
      newStatus: report.status,
      changedById: user.id,
      changedByName: user.name,
      changedByRole: 'admin',
      note: `Reassigned to ${input.department}${input.team ? ` — team ${input.team}` : ''}.`,
    });
    message = `Complaint ${report.complaintId} reassigned to ${input.department}.`;

    await repo.createNotification({
      userId: report.citizenId,
      complaintId: report.complaintId,
      reportId: report.id,
      message,
      type: 'assigned',
    });

    res.json({ report: updated, statusChanged: false });
  } catch (error) {
    next(error);
  }
}

export async function setPriority(req: Request, res: Response, next: NextFunction) {
  try {
    const input = prioritySchema.parse(req.body);
    const repo = getRepo();
    const user = req.user!;

    const report = await repo.getReport(req.params.id);
    if (!report) throw notFound('Complaint not found');

    const reason =
      input.reason ||
      `Set manually by ${user.name} (overrode auto-suggestion of ${report.priority}).`;

    const updated = await repo.updateReport(report.id, {
      priority: input.priority,
      priorityReason: reason,
      prioritySource: 'admin',
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw notFound('Complaint not found');

    await repo.addHistory({
      reportId: report.id,
      previousStatus: report.status,
      newStatus: report.status,
      changedById: user.id,
      changedByName: user.name,
      changedByRole: 'admin',
      note: `Priority changed from ${titleCase(report.priority)} to ${titleCase(input.priority)}. ${reason}`,
    });

    res.json({ report: updated });
  } catch (error) {
    next(error);
  }
}

export async function analytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await getRepo().allReports();
    res.json(computeAnalytics(reports));
  } catch (error) {
    next(error);
  }
}

export async function reportDuplicates(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = getRepo();
    const report = await repo.getReport(req.params.id);
    if (!report) throw notFound('Complaint not found');
    const duplicates = await findNearbyDuplicates(report);
    res.json({ duplicates });
  } catch (error) {
    next(error);
  }
}
