import { Request, Response } from 'express';
import Papa from 'papaparse';
import * as txService from './transaction.service.js';
import { AccountModel } from '../accounts/account.model.js';
import { emitToUser } from '../../sockets/index.js';
import { generateAiInsight } from '../analytics/analytics.service.js';
import { BudgetModel } from '../budgets/budget.model.js';

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
  const userId = req.user!._id.toString();
  const input = req.body;
  if (!input.accountId) {
    let account = await AccountModel.findOne({ userId });
    if (!account) {
      account = await AccountModel.create({ userId, name: 'Default Account', type: 'checking', currency: 'INR', balance: 0 });
    }
    input.accountId = account._id.toString();
  }
  if (!input.date) input.date = input.timestamp || new Date();

  const tx = await txService.createTransaction(userId, input);

  try {
    const budget = await BudgetModel.findOne({ userId });
    const threshold = budget?.globalThreshold ?? 5000;
    if (tx.amount > threshold) {
      const aiMsg = await generateAiInsight(userId, { type: 'coach_alert', totalSpend: tx.amount, category: tx.category });
      emitToUser(userId, 'coach:alert', {
        _id: tx._id,
        amount: tx.amount,
        description: `${tx.merchantName} · ${tx.category}`,
        coachState: 1,
        tone: 'firm',
        message: aiMsg.insight,
        shadowInsight: `₹${tx.amount} invested monthly = ₹${Math.round(tx.amount * Math.pow(1.12, 10))} in 10 years (SIP @ 12%)`,
        projectedSIP: Math.round(tx.amount * Math.pow(1.12, 10)),
        projectedFD: Math.round(tx.amount * Math.pow(1.065, 10)),
        projectedInflationAdj: Math.round(tx.amount * Math.pow(1.065, 10) / Math.pow(1.06, 10)),
      });
    }
  } catch (err) {
    console.error('Failed to trigger coach alert:', err);
  }

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

export async function uploadCSV(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    return;
  }

  const userId = req.user!._id.toString();

  // Get or create default account
  let account = await AccountModel.findOne({ userId, isDeleted: { $ne: true } });
  if (!account) {
    account = await AccountModel.create({
      userId,
      name: 'Default Account',
      type: 'checking',
      currency: 'INR',
      balance: 0,
    });
  }

  const text = req.file.buffer.toString('utf-8');
  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0 && data.length === 0) {
    res.status(400).json({ success: false, error: { message: 'CSV parse failed', details: errors } });
    return;
  }

  let imported = 0;
  const skipped: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      // Flexible column name detection
      const rawAmount =
        row['amount'] ?? row['Amount'] ?? row['AMOUNT'] ??
        row['debit'] ?? row['Debit'] ?? '';

      const amount = Math.abs(parseFloat(rawAmount));
      if (!amount || isNaN(amount)) { skipped.push(i + 2); continue; }

      const category =
        row['category'] ?? row['Category'] ?? row['CATEGORY'] ?? 'Other';

      const merchantName =
        row['merchantName'] ?? row['merchant'] ?? row['Merchant'] ??
        row['description'] ?? row['Description'] ?? 'Unknown';

      const description =
        row['description'] ?? row['Description'] ?? row['notes'] ?? '';

      const rawDate =
        row['timestamp'] ?? row['date'] ?? row['Date'] ??
        row['DATE'] ?? row['Transaction Date'] ?? '';

      const date = rawDate ? new Date(rawDate) : new Date();
      if (isNaN(date.getTime())) { skipped.push(i + 2); continue; }

      await txService.createTransaction(userId, {
        accountId: account._id.toString(),
        type: 'expense',
        amount: Math.round(amount),
        currency: 'INR',
        category,
        merchantName,
        description,
        date,
        source: 'csv',
        isIntercepted: false,
      });

      imported++;
    } catch {
      skipped.push(i + 2);
    }
  }

  res.json({
    success: true,
    data: {
      importedCount: imported,
      skippedRows: skipped,
      message: `Successfully imported ${imported} transaction${imported !== 1 ? 's' : ''}`,
    },
  });
}

export async function triggerMockFeed(req: Request, res: Response): Promise<void> {
  const userId = req.user!._id.toString();

  // Get or create default account
  let account = await AccountModel.findOne({ userId, isDeleted: { $ne: true } });
  if (!account) {
    account = await AccountModel.create({
      userId,
      name: 'Default Account',
      type: 'checking',
      currency: 'INR',
      balance: 0,
    });
  }

  const MERCHANTS = [
    { name: 'Zomato', category: 'Food' },
    { name: 'Swiggy', category: 'Food' },
    { name: 'Blinkit', category: 'Groceries' },
    { name: 'Amazon', category: 'Shopping' },
    { name: 'Flipkart', category: 'Shopping' },
    { name: 'Myntra', category: 'Shopping' },
    { name: 'Ola', category: 'Transport' },
    { name: 'Uber', category: 'Transport' },
    { name: 'Netflix', category: 'Entertainment' },
    { name: 'BookMyShow', category: 'Entertainment' },
    { name: 'Nykaa', category: 'Shopping' },
    { name: 'Rapido', category: 'Transport' },
  ];

  const pick = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)]!;
  const amount = Math.floor(Math.random() * 3000) + 200;

  const tx = await txService.createTransaction(userId, {
    accountId: account._id.toString(),
    type: 'expense',
    amount,
    currency: 'INR',
    category: pick.category,
    merchantName: pick.name,
    description: `${pick.name} order`,
    date: new Date(),
    source: 'mock_api',
    isIntercepted: false,
  });

  try {
    const budget = await BudgetModel.findOne({ userId });
    const threshold = budget?.globalThreshold ?? 5000;
    if (amount > threshold) {
      const aiMsg = await generateAiInsight(userId, { type: 'coach_alert', totalSpend: amount, category: pick.category });
      emitToUser(userId, 'coach:alert', {
        _id: (tx as any)._id,
        amount: amount,
        description: `${pick.name} · ${pick.category}`,
        coachState: 1,
        tone: 'firm',
        message: aiMsg.insight,
        shadowInsight: `₹${amount} invested monthly = ₹${Math.round(amount * Math.pow(1.12, 10))} in 10 years (SIP @ 12%)`,
        projectedSIP: Math.round(amount * Math.pow(1.12, 10)),
        projectedFD: Math.round(amount * Math.pow(1.065, 10)),
        projectedInflationAdj: Math.round(amount * Math.pow(1.065, 10) / Math.pow(1.06, 10)),
      });
    }
  } catch (err) {
    console.error('Failed to trigger coach alert in mock feed:', err);
  }

  res.status(201).json({
    success: true,
    data: {
      ...((tx as any).toObject ? (tx as any).toObject() : tx),
      merchantName: pick.name,
    },
  });
}