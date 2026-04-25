import { Request, Response } from 'express';
import { getCoachInsight, updateCoachState } from './coach.service.js';

export async function getInsight(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const insight = await getCoachInsight(req.user!._id.toString());
  res.json({ success: true, data: insight });
}

export async function setCoachState(req: Request, res: Response): Promise<void> {
  await updateCoachState(req.user!._id.toString(), req.body.coachState);
  res.json({ success: true, data: { message: 'Coach style updated' } });
}
