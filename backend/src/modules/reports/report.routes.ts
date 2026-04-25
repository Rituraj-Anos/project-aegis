import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { reportQuerySchema } from './report.schema.js';
import { generateReportController } from './report.controller.js';

export const reportRouter = Router();
reportRouter.use(requireAuth);

reportRouter.get('/', validate({ query: reportQuerySchema }), generateReportController);
