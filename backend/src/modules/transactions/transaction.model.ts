import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  description?: string;
  merchantName?: string;
  source: 'csv' | 'manual' | 'mock_api';
  isIntercepted: boolean;
  alertId?: Types.ObjectId;
  date: Date;
  tags: string[];
  isRecurring: boolean;
  recurringId?: Types.ObjectId;
  transferToAccountId?: Types.ObjectId;
  transferFee?: number;
  attachments?: string[];
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    subcategory: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    merchantName: { type: String, trim: true, maxlength: 100 },
    source: { type: String, enum: ['csv', 'manual', 'mock_api'], default: 'manual' },
    isIntercepted: { type: Boolean, default: false },
    alertId: { type: Schema.Types.ObjectId, ref: 'Alert' },
    date: { type: Date, required: true },
    tags: { type: [String], default: [] },
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: Schema.Types.ObjectId },
    transferToAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    transferFee: { type: Number, default: 0 },
    attachments: { type: [String] },
    notes: { type: String, maxlength: 1000 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, isDeleted: 1 });
transactionSchema.index({ userId: 1, isIntercepted: 1 });

export const TransactionModel: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default TransactionModel;
