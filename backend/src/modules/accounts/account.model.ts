import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan' | 'other';
  currency: string;
  balance: number;
  institution?: string;
  color?: string;
  icon?: string;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    type:        { type: String, enum: ['checking','savings','credit_card','cash','investment','loan','other'], required: true },
    currency:    { type: String, default: 'USD', uppercase: true, trim: true, maxlength: 3 },
    balance:     { type: Number, required: true, default: 0 },
    institution: { type: String, trim: true, maxlength: 100 },
    color:       { type: String },
    icon:        { type: String },
    isArchived:  { type: Boolean, default: false },
    isDeleted:   { type: Boolean, default: false },
    deletedAt:   { type: Date },
  },
  { timestamps: true },
);

accountSchema.index({ userId: 1, isDeleted: 1 });
accountSchema.index({ userId: 1, isArchived: 1 });

export const AccountModel: Model<IAccount> = mongoose.model<IAccount>('Account', accountSchema);
export default AccountModel;
