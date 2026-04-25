import { z } from 'zod';

export const createBudgetSchema = z.object({
  name:      z.string().min(1).max(100).trim(),
  category:  z.string().min(1).max(100).trim(),
  period:    z.enum(['weekly','monthly','yearly']),
  amount:    z.number().int().positive(),
  currency:  z.string().length(3).toUpperCase().default('USD'),
  startDate: z.coerce.date(),
  endDate:   z.coerce.date().optional(),
  color:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
