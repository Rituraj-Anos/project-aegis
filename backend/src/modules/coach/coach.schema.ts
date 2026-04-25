import { z } from 'zod';

export const coachStateSchema = z.object({
  coachState: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});

export type CoachStateInput = z.infer<typeof coachStateSchema>;
