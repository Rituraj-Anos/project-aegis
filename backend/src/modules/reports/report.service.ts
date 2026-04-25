import { Types } from 'mongoose';
import { PassThrough } from 'node:stream';
import PDFDocument from 'pdfkit';
import { format as csvFormat } from '@fast-csv/format';
import { TransactionModel } from '../transactions/transaction.model.js';
import { getCashFlow, getCategoryBreakdown } from '../analytics/analytics.service.js';
import type { ReportQuery } from './report.schema.js';

export interface ReportOutput {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

function dateFmt(d: Date): string { return d.toISOString().slice(0, 10); }
function cents(n: number): string { return (n / 100).toFixed(2); }

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

// ── CSV helpers ──────────────────────────────────────────

async function writeCsv(rows: Record<string, string | number>[], headers: string[]): Promise<Buffer> {
  const pass = new PassThrough();
  const csv = csvFormat({ headers });
  csv.pipe(pass);
  for (const row of rows) csv.write(row);
  csv.end();
  return streamToBuffer(pass);
}

// ── PDF helpers ──────────────────────────────────────────

async function pdfToBuffer(render: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const pass = new PassThrough();
  doc.pipe(pass);
  render(doc);
  doc.end();
  return streamToBuffer(pass);
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], colWidths: number[], startY: number) {
  const x0 = 40;
  let y = startY;
  // Header
  doc.font('Helvetica-Bold').fontSize(8);
  headers.forEach((h, i) => doc.text(h, x0 + colWidths.slice(0, i).reduce((s, w) => s + w, 0), y, { width: colWidths[i], align: 'left' }));
  y += 14;
  doc.moveTo(x0, y).lineTo(x0 + colWidths.reduce((s, w) => s + w, 0), y).stroke();
  y += 4;
  // Rows
  doc.font('Helvetica').fontSize(7);
  for (const row of rows) {
    if (y > 760) { doc.addPage(); y = 40; }
    row.forEach((cell, i) => doc.text(cell, x0 + colWidths.slice(0, i).reduce((s, w) => s + w, 0), y, { width: colWidths[i], align: 'left' }));
    y += 12;
  }
  return y;
}

// ── Report generators ────────────────────────────────────

async function transactionsCsv(userId: string, q: ReportQuery): Promise<ReportOutput> {
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId), isDeleted: false,
    date: { $gte: q.startDate, $lte: q.endDate },
  };
  if (q.accountId) filter['accountId'] = new Types.ObjectId(q.accountId);
  const txs = await TransactionModel.find(filter).sort({ date: -1 }).lean();

  const rows = (txs as any[]).map((t) => ({
    Date: dateFmt(t.date), Type: t.type, Category: t.category,
    Subcategory: t.subcategory ?? '', Description: t.description ?? '',
    Amount: cents(t.amount), Currency: t.currency, AccountId: t.accountId.toString(),
    Tags: (t.tags ?? []).join(';'), Notes: t.notes ?? '',
  }));

  const buffer = await writeCsv(rows, ['Date','Type','Category','Subcategory','Description','Amount','Currency','AccountId','Tags','Notes']);
  return { buffer, contentType: 'text/csv', filename: `transactions_${dateFmt(q.startDate)}_to_${dateFmt(q.endDate)}.csv` };
}

async function transactionsPdf(userId: string, q: ReportQuery): Promise<ReportOutput> {
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId), isDeleted: false,
    date: { $gte: q.startDate, $lte: q.endDate },
  };
  if (q.accountId) filter['accountId'] = new Types.ObjectId(q.accountId);
  const txs = await TransactionModel.find(filter).sort({ date: -1 }).lean() as any[];

  const totalIncome   = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const buffer = await pdfToBuffer((doc) => {
    doc.font('Helvetica-Bold').fontSize(16).text('Project Aegis — Transaction Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`${dateFmt(q.startDate)} to ${dateFmt(q.endDate)} • Generated ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(10)
      .text(`Income: ${cents(totalIncome)}  |  Expenses: ${cents(totalExpenses)}  |  Net: ${cents(totalIncome - totalExpenses)}`);
    doc.moveDown();

    const headers = ['Date','Type','Category','Description','Amount','Curr','Account'];
    const rows = txs.map((t) => [dateFmt(t.date), t.type, t.category, (t.description ?? '').slice(0, 30), cents(t.amount), t.currency, t.accountId.toString().slice(-6)]);
    drawTable(doc, headers, rows, [65, 55, 80, 110, 60, 35, 55], doc.y);
  });

  return { buffer, contentType: 'application/pdf', filename: `transactions_${dateFmt(q.startDate)}_to_${dateFmt(q.endDate)}.pdf` };
}

async function cashFlowCsv(userId: string, q: ReportQuery): Promise<ReportOutput> {
  const cf = await getCashFlow(userId, { startDate: q.startDate, endDate: q.endDate, groupBy: 'month', currency: 'USD', accountId: q.accountId });
  const rows = cf.periods.map((p) => ({ Period: p.label, Income: cents(p.income), Expenses: cents(p.expenses), Net: cents(p.net) }));
  rows.push({ Period: 'TOTALS', Income: cents(cf.totals.income), Expenses: cents(cf.totals.expenses), Net: cents(cf.totals.net) });
  const buffer = await writeCsv(rows, ['Period','Income','Expenses','Net']);
  return { buffer, contentType: 'text/csv', filename: `cash_flow_${dateFmt(q.startDate)}_to_${dateFmt(q.endDate)}.csv` };
}

async function cashFlowPdf(userId: string, q: ReportQuery): Promise<ReportOutput> {
  const cf = await getCashFlow(userId, { startDate: q.startDate, endDate: q.endDate, groupBy: 'month', currency: 'USD', accountId: q.accountId });
  const buffer = await pdfToBuffer((doc) => {
    doc.font('Helvetica-Bold').fontSize(16).text('Project Aegis — Cash Flow Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`${dateFmt(q.startDate)} to ${dateFmt(q.endDate)}`, { align: 'center' });
    doc.moveDown();
    const headers = ['Period','Income','Expenses','Net'];
    const rows = cf.periods.map((p) => [p.label, cents(p.income), cents(p.expenses), cents(p.net)]);
    rows.push(['TOTALS', cents(cf.totals.income), cents(cf.totals.expenses), cents(cf.totals.net)]);
    drawTable(doc, headers, rows, [100, 100, 100, 100], doc.y);
  });
  return { buffer, contentType: 'application/pdf', filename: `cash_flow_${dateFmt(q.startDate)}_to_${dateFmt(q.endDate)}.pdf` };
}

async function categoryCsv(userId: string, q: ReportQuery): Promise<ReportOutput> {
  const cb = await getCategoryBreakdown(userId, { startDate: q.startDate, endDate: q.endDate, groupBy: 'month', currency: 'USD', accountId: q.accountId });
  const rows: Record<string, string | number>[] = [];
  rows.push({ Category: '--- EXPENSES ---', Amount: '', Percentage: '', Count: '' });
  cb.expenses.forEach((e) => rows.push({ Category: e.category, Amount: cents(e.amount), Percentage: `${e.percentage}%`, Count: e.count }));
  rows.push({ Category: '--- INCOME ---', Amount: '', Percentage: '', Count: '' });
  cb.income.forEach((i) => rows.push({ Category: i.category, Amount: cents(i.amount), Percentage: `${i.percentage}%`, Count: i.count }));
  const buffer = await writeCsv(rows, ['Category','Amount','Percentage','Count']);
  return { buffer, contentType: 'text/csv', filename: `category_summary_${dateFmt(q.startDate)}_to_${dateFmt(q.endDate)}.csv` };
}

async function categoryPdf(userId: string, q: ReportQuery): Promise<ReportOutput> {
  const cb = await getCategoryBreakdown(userId, { startDate: q.startDate, endDate: q.endDate, groupBy: 'month', currency: 'USD', accountId: q.accountId });
  const buffer = await pdfToBuffer((doc) => {
    doc.font('Helvetica-Bold').fontSize(16).text('Project Aegis — Category Summary', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`${dateFmt(q.startDate)} to ${dateFmt(q.endDate)}`, { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(12).text('Expenses');
    const y = drawTable(doc, ['Category','Amount','%','Count'], cb.expenses.map((e) => [e.category, cents(e.amount), `${e.percentage}%`, String(e.count)]), [150, 100, 60, 60], doc.y + 4);
    doc.y = y + 16;
    doc.font('Helvetica-Bold').fontSize(12).text('Income');
    drawTable(doc, ['Category','Amount','%','Count'], cb.income.map((i) => [i.category, cents(i.amount), `${i.percentage}%`, String(i.count)]), [150, 100, 60, 60], doc.y + 4);
  });
  return { buffer, contentType: 'application/pdf', filename: `category_summary_${dateFmt(q.startDate)}_to_${dateFmt(q.endDate)}.pdf` };
}

// ── Main router ──────────────────────────────────────────

const GENERATORS: Record<string, Record<string, (userId: string, q: ReportQuery) => Promise<ReportOutput>>> = {
  transactions:       { csv: transactionsCsv, pdf: transactionsPdf },
  'cash-flow':        { csv: cashFlowCsv,     pdf: cashFlowPdf },
  'category-summary': { csv: categoryCsv,     pdf: categoryPdf },
};

export async function generateReport(userId: string, query: ReportQuery): Promise<ReportOutput> {
  const gen = GENERATORS[query.type]?.[query.format];
  if (!gen) throw new Error(`Unsupported report: ${query.type}/${query.format}`);
  return gen(userId, query);
}
