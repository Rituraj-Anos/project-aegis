import { z } from 'zod';

export const reportQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate:   z.coerce.date(),
  format:    z.enum(['csv','pdf']).default('csv'),
  accountId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  type:      z.enum(['transactions','cash-flow','category-summary']).default('transactions'),
}).superRefine((data, ctx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'endDate must be >= startDate' });
  }
  const diffDays = (data.endDate.getTime() - data.startDate.getTime()) / 86_400_000;
  if (diffDays > 366) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Date range must not exceed 366 days' });
  }
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
