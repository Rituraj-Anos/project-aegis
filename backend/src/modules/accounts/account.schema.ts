import { z } from 'zod';

export const createAccountSchema = z.object({
  name:        z.string().min(1).max(100).trim(),
  type:        z.enum(['checking','savings','credit_card','cash','investment','loan','other']),
  currency:    z.string().length(3).toUpperCase().default('USD'),
  balance:     z.number().int().default(0),
  institution: z.string().max(100).trim().optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon:        z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
