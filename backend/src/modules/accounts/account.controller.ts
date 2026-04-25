import { Request, Response } from 'express';
import * as accountService from './account.service.js';

export async function listAccounts(req: Request, res: Response): Promise<void> {
  const includeArchived = req.query['includeArchived'] === 'true';
  const accounts = await accountService.getAccounts(req.user!._id.toString(), includeArchived);
  res.json({ success: true, data: accounts });
}

export async function getAccount(req: Request, res: Response): Promise<void> {
  const account = await accountService.getAccountById(req.params['accountId'] as string, req.user!._id.toString());
  res.json({ success: true, data: account });
}

export async function createAccount(req: Request, res: Response): Promise<void> {
  const account = await accountService.createAccount(req.user!._id.toString(), req.body);
  res.status(201).json({ success: true, data: account });
}

export async function updateAccount(req: Request, res: Response): Promise<void> {
  const account = await accountService.updateAccount(req.params['accountId'] as string, req.user!._id.toString(), req.body);
  res.json({ success: true, data: account });
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  await accountService.deleteAccount(req.params['accountId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { message: 'Account deleted' } });
}
