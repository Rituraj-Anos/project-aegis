import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate:   z.coerce.date(),
  currency:  z.string().length(3).toUpperCase().default('USD'),
  groupBy:   z.enum(['day','week','month']).default('month'),
  accountId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).superRefine((data, ctx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'endDate must be >= startDate' });
  }
  const diffDays = (data.endDate.getTime() - data.startDate.getTime()) / 86_400_000;
  if (diffDays > 366) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Date range must not exceed 366 days' });
  }
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
