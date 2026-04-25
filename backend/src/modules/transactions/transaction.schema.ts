import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createTransactionSchema = z.object({
  accountId: z.string().regex(objectIdRegex, 'Invalid ObjectId').optional(),
  type: z.enum(['income', 'expense', 'transfer']).default('expense'),
  amount: z.number().int().positive(),
  currency: z.string().length(3).toUpperCase().default('INR'),
  category: z.string().min(1).max(100).trim(),
  subcategory: z.string().max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  merchantName: z.string().max(100).trim().optional(),
  source: z.enum(['csv', 'manual', 'mock_api']).default('manual'),
  isIntercepted: z.boolean().default(false),
  date: z.coerce.date().optional(),
  timestamp: z.coerce.date().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  isRecurring: z.boolean().default(false),
  transferToAccountId: z.string().regex(objectIdRegex).optional(),
  transferFee: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'transfer') {
    if (!data.transferToAccountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['transferToAccountId'], message: 'transferToAccountId is required for transfers' });
    } else if (data.transferToAccountId === data.accountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['transferToAccountId'], message: 'transferToAccountId must differ from accountId' });
    }
  }
});

export const updateTransactionSchema = z.object({
  accountId: z.string().regex(objectIdRegex).optional(),
  amount: z.number().int().positive().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  category: z.string().min(1).max(100).trim().optional(),
  subcategory: z.string().max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  merchantName: z.string().max(100).trim().optional(),
  isIntercepted: z.boolean().optional(),
  date: z.coerce.date().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isRecurring: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const listTransactionsSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  source: z.enum(['csv', 'manual', 'mock_api']).optional(),
  isIntercepted: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['date', 'amount', 'category']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;