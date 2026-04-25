import { z } from 'zod';

export const updateMeSchema = z.object({
  name:       z.string().min(2).max(100).trim().optional(),
  coachState: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
