import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { idempotency } from '../../middleware/idempotency.js';
import { createTransactionSchema, updateTransactionSchema, listTransactionsSchema } from './transaction.schema.js';
import { listTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, uploadCSV, triggerMockFeed } from './transaction.controller.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export const transactionRouter = Router();
transactionRouter.use(requireAuth);

transactionRouter.get('/',       validate({ query: listTransactionsSchema }), listTransactions);
transactionRouter.get('/:txId',  getTransaction);
transactionRouter.post('/upload', upload.single('file'), uploadCSV);
transactionRouter.post('/mock-feed', triggerMockFeed);
transactionRouter.post('/',      idempotency, validate({ body: createTransactionSchema }), createTransaction);
transactionRouter.patch('/:txId', validate({ body: updateTransactionSchema }), updateTransaction);
transactionRouter.delete('/:txId', deleteTransaction);
