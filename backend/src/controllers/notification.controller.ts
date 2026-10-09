import { Request, Response, NextFunction } from 'express';
import { getRepo } from '../repo';
import { notFound } from '../utils/errors';

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await getRepo().listNotifications(req.user!.id);
    res.json({
      notifications: items,
      unread: items.filter((n) => !n.read).length,
    });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await getRepo().markNotificationRead(req.params.id, req.user!.id);
    if (!item) throw notFound('Notification not found');
    res.json({ notification: item });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await getRepo().markAllNotificationsRead(req.user!.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
