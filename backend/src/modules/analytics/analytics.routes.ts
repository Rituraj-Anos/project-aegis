import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { analyticsQuerySchema } from './analytics.schema.js';
import { getCashFlow, getCategoryBreakdown, getNetWorthHistory, getSavingsRate } from './analytics.controller.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const v = validate({ query: analyticsQuerySchema });

analyticsRouter.get('/cash-flow',          v, getCashFlow);
analyticsRouter.get('/category-breakdown', v, getCategoryBreakdown);
analyticsRouter.get('/net-worth',          v, getNetWorthHistory);
analyticsRouter.get('/savings-rate',       v, getSavingsRate);
