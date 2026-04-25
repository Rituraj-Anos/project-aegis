import { Request, Response } from 'express';
import * as notifService from './notification.service.js';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const result = await notifService.listNotifications(req.user!._id.toString(), req.query as any);
  res.json({ success: true, data: result.data, unreadCount: result.unreadCount, pagination: { total: result.total, page: result.page, totalPages: result.totalPages } });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  await notifService.markAsRead(req.user!._id.toString(), req.body.notificationIds);
  res.json({ success: true, data: { message: 'Marked as read' } });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await notifService.markAllAsRead(req.user!._id.toString());
  res.json({ success: true, data: { message: 'All marked as read' } });
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  await notifService.deleteNotification(req.params['notificationId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { message: 'Deleted' } });
}
