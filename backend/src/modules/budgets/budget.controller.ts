import { Request, Response } from 'express';
import * as budgetService from './budget.service.js';

export async function listBudgets(req: Request, res: Response): Promise<void> {
  const budgets = await budgetService.getBudgets(req.user!._id.toString());
  res.json({ success: true, data: budgets });
}

export async function getBudget(req: Request, res: Response): Promise<void> {
  const budget = await budgetService.getBudgetById(req.params['budgetId'] as string, req.user!._id.toString());
  res.json({ success: true, data: budget });
}

export async function createBudget(req: Request, res: Response): Promise<void> {
  const budget = await budgetService.createBudget(req.user!._id.toString(), req.body);
  res.status(201).json({ success: true, data: budget });
}

export async function updateBudget(req: Request, res: Response): Promise<void> {
  const budget = await budgetService.updateBudget(req.params['budgetId'] as string, req.user!._id.toString(), req.body);
  res.json({ success: true, data: budget });
}

export async function deleteBudget(req: Request, res: Response): Promise<void> {
  await budgetService.deleteBudget(req.params['budgetId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { message: 'Budget deleted' } });
}
