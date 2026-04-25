import { Request, Response } from 'express';
import { generateReport } from './report.service.js';
import type { ReportQuery } from './report.schema.js';

export async function generateReportController(req: Request, res: Response): Promise<void> {
  const result = await generateReport(req.user!._id.toString(), req.query as unknown as ReportQuery);

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('Content-Length', result.buffer.length);
  res.setHeader('Cache-Control', 'no-store');
  res.end(result.buffer);
}
