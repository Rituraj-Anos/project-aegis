import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { idempotency } from '../../middleware/idempotency.js';
import { createAccountSchema, updateAccountSchema } from './account.schema.js';
import { listAccounts, getAccount, createAccount, updateAccount, deleteAccount } from './account.controller.js';

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.get('/',             listAccounts);
accountRouter.get('/:accountId',   getAccount);
accountRouter.post('/',            idempotency, validate({ body: createAccountSchema }), createAccount);
accountRouter.patch('/:accountId', validate({ body: updateAccountSchema }), updateAccount);
accountRouter.delete('/:accountId', deleteAccount);
