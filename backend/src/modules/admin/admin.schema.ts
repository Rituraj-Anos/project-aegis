import { z } from 'zod';

export const listUsersSchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().optional(),
  role:      z.enum(['user','admin']).optional(),
  isDeleted: z.coerce.boolean().default(false),
  sortBy:    z.enum(['createdAt','email','name']).default('createdAt'),
  sortOrder: z.enum(['asc','desc']).default('desc'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user','admin']),
});

export type ListUsersQuery     = z.infer<typeof listUsersSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
