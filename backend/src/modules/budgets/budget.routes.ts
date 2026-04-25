import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { idempotency } from '../../middleware/idempotency.js';
import { createBudgetSchema, updateBudgetSchema } from './budget.schema.js';
import { listBudgets, getBudget, createBudget, updateBudget, deleteBudget } from './budget.controller.js';

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

budgetRouter.get('/',             listBudgets);
budgetRouter.get('/:budgetId',    getBudget);
budgetRouter.post('/',            idempotency, validate({ body: createBudgetSchema }), createBudget);
budgetRouter.patch('/:budgetId',  validate({ body: updateBudgetSchema }), updateBudget);
budgetRouter.delete('/:budgetId', deleteBudget);
