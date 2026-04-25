import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IBudget extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  category: string;
  period: 'weekly' | 'monthly' | 'yearly';
  amount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  color?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:      { type: String, required: true, trim: true, maxlength: 100 },
    category:  { type: String, required: true, trim: true, maxlength: 100 },
    period:    { type: String, enum: ['weekly','monthly','yearly'], required: true },
    amount:    { type: Number, required: true, min: 1 },
    currency:  { type: String, default: 'USD' },
    startDate: { type: Date, required: true },
    endDate:   { type: Date },
    color:     { type: String },
    isActive:  { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, isDeleted: 1 });
budgetSchema.index({ userId: 1, category: 1, isActive: 1 });

export const BudgetModel: Model<IBudget> = mongoose.model<IBudget>('Budget', budgetSchema);
export default BudgetModel;
