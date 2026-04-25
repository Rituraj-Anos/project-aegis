import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { coachStateSchema } from './coach.schema.js';
import { getInsight, setCoachState } from './coach.controller.js';

export const coachRouter = Router();
coachRouter.use(requireAuth);

coachRouter.get('/insight', getInsight);
coachRouter.post('/state',  validate({ body: coachStateSchema }), setCoachState);
