import { Request, Response } from 'express';
import * as txService from './transaction.service.js';

export async function listTransactions(req: Request, res: Response): Promise<void> {
  const result = await txService.listTransactions(req.user!._id.toString(), req.query as any);
  res.json({
    success: true,
    data: result.data,
    pagination: { total: result.total, page: result.page, totalPages: result.totalPages, limit: Number(req.query['limit'] ?? 20) },
  });
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  const tx = await txService.getTransactionById(req.params['txId'] as string, req.user!._id.toString());
  res.json({ success: true, data: tx });
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  const tx = await txService.createTransaction(req.user!._id.toString(), req.body);
  res.status(201).json({ success: true, data: tx });
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  const tx = await txService.updateTransaction(req.params['txId'] as string, req.user!._id.toString(), req.body);
  res.json({ success: true, data: tx });
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  await txService.deleteTransaction(req.params['txId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { message: 'Transaction deleted' } });
}
