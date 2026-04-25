import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { analyticsQuerySchema } from './analytics.schema.js';
import {
    getCashFlow,
    getCategoryBreakdown,
    getNetWorthHistory,
    getSavingsRate,
    getCategoryHeatmap,
    getSavingsStreak,
    getTriggerMap,
    getWeeklyReport,
    getCounterfactual,
    getAiInsight,
} from './analytics.controller.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const v = validate({ query: analyticsQuerySchema });

// ── Legacy endpoints ─────────────────────────────────────
analyticsRouter.get('/cash-flow', v, getCashFlow);
analyticsRouter.get('/category-breakdown', v, getCategoryBreakdown);
analyticsRouter.get('/net-worth', v, getNetWorthHistory);
analyticsRouter.get('/savings-rate', v, getSavingsRate);

// ── Aegis frontend endpoints ─────────────────────────────
analyticsRouter.get('/category-heatmap', getCategoryHeatmap);
analyticsRouter.get('/savings-streak', getSavingsStreak);
analyticsRouter.get('/trigger-map', getTriggerMap);
analyticsRouter.get('/weekly-report', getWeeklyReport);
analyticsRouter.get('/counterfactual', getCounterfactual);
analyticsRouter.post('/ai-insight', getAiInsight);