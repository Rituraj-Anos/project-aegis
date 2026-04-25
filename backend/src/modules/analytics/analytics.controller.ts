import { Request, Response } from 'express';
import * as analyticsService from './analytics.service.js';
import type { AnalyticsQuery } from './analytics.schema.js';

export async function getCashFlow(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getCashFlow(req.user!._id.toString(), req.query as unknown as AnalyticsQuery);
  res.json({ success: true, data: result });
}

export async function getCategoryBreakdown(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getCategoryBreakdown(req.user!._id.toString(), req.query as unknown as AnalyticsQuery);
  res.json({ success: true, data: result });
}

export async function getNetWorthHistory(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getNetWorthHistory(req.user!._id.toString(), req.query as unknown as AnalyticsQuery);
  res.json({ success: true, data: result });
}

export async function getSavingsRate(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getSavingsRate(req.user!._id.toString(), req.query as unknown as AnalyticsQuery);
  res.json({ success: true, data: result });
}
