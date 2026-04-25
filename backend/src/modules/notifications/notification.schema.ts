import { z } from 'zod';

export const listNotificationsSchema = z.object({
  isRead: z.coerce.boolean().optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
});

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(50),
});

export const userAlertPrefsSchema = z.object({
  lowBalanceThreshold:    z.number().int().min(0).default(10000),
  largeTransactionAmount: z.number().int().min(0).default(50000),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
export type MarkReadInput          = z.infer<typeof markReadSchema>;
export type UserAlertPrefsInput    = z.infer<typeof userAlertPrefsSchema>;
