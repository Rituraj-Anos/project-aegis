import { Request, Response } from 'express';
import * as adminService from './admin.service.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = await adminService.listUsers(req.query as any);
  res.json({ success: true, ...result });
}

export async function getUserDetails(req: Request, res: Response): Promise<void> {
  const details = await adminService.getUserDetails(req.params['userId'] as string);
  res.json({ success: true, data: details });
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  await adminService.updateUserRole(req.params['userId'] as string, req.body);
  res.json({ success: true, data: { message: 'Role updated' } });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  await adminService.softDeleteUser(req.params['userId'] as string, req.user!._id.toString());
  res.json({ success: true, data: { message: 'User deleted' } });
}

export async function unlockUser(req: Request, res: Response): Promise<void> {
  await adminService.unlockUser(req.params['userId'] as string);
  res.json({ success: true, data: { message: 'User unlocked' } });
}

export async function getPlatformStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getPlatformStats();
  res.json({ success: true, data: stats });
}
