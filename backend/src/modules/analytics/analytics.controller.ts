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

export async function getCategoryHeatmap(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getCategoryHeatmap(req.user!._id.toString());
  res.json({ success: true, data: result });
}

export async function getSavingsStreak(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getSavingsStreak(req.user!._id.toString());
  res.json({ success: true, data: result });
}

export async function getTriggerMap(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getTriggerMap(req.user!._id.toString());
  res.json({ success: true, data: result });
}

export async function getWeeklyReport(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getWeeklyReport(req.user!._id.toString());
  res.json({ success: true, data: result });
}

export async function getCounterfactual(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.getCounterfactual(req.user!._id.toString());
  res.json({ success: true, data: result });
}

export async function getAiInsight(req: Request, res: Response): Promise<void> {
  const result = await analyticsService.generateAiInsight(req.user!._id.toString(), req.body);
  res.json({ success: true, data: result });
}