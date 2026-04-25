import { Types } from 'mongoose';
import { NotificationModel, INotification } from './notification.model.js';

export interface CreateNotificationPayload {
  userId: string;
  type: INotification['type'];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<INotification> {
  return NotificationModel.create({
    userId: new Types.ObjectId(payload.userId),
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });
}

export async function listNotifications(userId: string, query: { isRead?: boolean; page: number; limit: number }) {
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (query.isRead !== undefined) filter['isRead'] = query.isRead;

  const [total, data, unreadCount] = await Promise.all([
    NotificationModel.countDocuments(filter),
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    NotificationModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
  ]);

  return {
    data, unreadCount, total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function markAsRead(userId: string, notificationIds: string[]): Promise<void> {
  await NotificationModel.updateMany(
    { _id: { $in: notificationIds.map((id) => new Types.ObjectId(id)) }, userId: new Types.ObjectId(userId) },
    { $set: { isRead: true, readAt: new Date() } },
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await NotificationModel.updateMany(
    { userId: new Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await NotificationModel.deleteOne({
    _id: new Types.ObjectId(notificationId),
    userId: new Types.ObjectId(userId),
  });
}
