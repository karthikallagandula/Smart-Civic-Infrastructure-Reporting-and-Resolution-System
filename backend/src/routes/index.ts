import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, register } from '../controllers/auth.controller';
import { createReport, getMyReport, listMyReports } from '../controllers/report.controller';
import {
  analytics,
  assignReport,
  getAdminReport,
  listAdminReports,
  reportDuplicates,
  setPriority,
  updateReportStatus,
} from '../controllers/admin.controller';
import { listNotifications, markAllRead, markRead } from '../controllers/notification.controller';
import { analyzeImage, assistText } from '../controllers/ai.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

/* ----------------------------- Authentication ---------------------------- */
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.get('/auth/me', requireAuth, me);

/* ------------------------------ Citizen reports -------------------------- */
router.post('/reports', requireAuth, upload.single('image'), createReport);
router.get('/reports/my', requireAuth, listMyReports);
router.get('/reports/:id', requireAuth, getMyReport);

/* ------------------------------ Administration --------------------------- */
router.get('/admin/reports', requireAuth, requireRole('admin'), listAdminReports);
router.get('/admin/reports/:id', requireAuth, requireRole('admin'), getAdminReport);
router.get('/admin/reports/:id/duplicates', requireAuth, requireRole('admin'), reportDuplicates);
router.patch(
  '/admin/reports/:id/status',
  requireAuth,
  requireRole('admin'),
  upload.single('resolutionImage'),
  updateReportStatus
);
router.patch('/admin/reports/:id/assign', requireAuth, requireRole('admin'), assignReport);
router.patch('/admin/reports/:id/priority', requireAuth, requireRole('admin'), setPriority);
router.get('/admin/analytics', requireAuth, requireRole('admin'), analytics);

/* ------------------------------- Notifications --------------------------- */
router.get('/notifications', requireAuth, listNotifications);
router.patch('/notifications/read-all', requireAuth, markAllRead);
router.patch('/notifications/:id/read', requireAuth, markRead);

/* --------------------------------- Optional AI --------------------------- */
router.post('/ai/analyze-image', requireAuth, upload.single('image'), analyzeImage);
router.post('/ai/assist-text', requireAuth, assistText);

export default router;
