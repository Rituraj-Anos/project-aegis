import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'budget_warning' | 'budget_exceeded' | 'low_balance' | 'large_transaction' | 'weekly_summary' | 'monthly_summary';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['budget_warning','budget_exceeded','low_balance','large_transaction','weekly_summary','monthly_summary'],
      required: true,
    },
    title: { type: String, required: true },
    body:  { type: String, required: true },
    data:  { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL

export const NotificationModel: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
export default NotificationModel;
