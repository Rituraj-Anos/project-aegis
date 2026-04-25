import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { listNotificationsSchema, markReadSchema } from './notification.schema.js';
import { listNotifications, markRead, markAllRead, deleteNotification } from './notification.controller.js';

export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get('/',                    validate({ query: listNotificationsSchema }), listNotifications);
notificationRouter.post('/mark-read',          validate({ body: markReadSchema }), markRead);
notificationRouter.post('/mark-all-read',      markAllRead);
notificationRouter.delete('/:notificationId',  deleteNotification);
