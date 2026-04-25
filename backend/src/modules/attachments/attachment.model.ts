import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IOcrData {
  rawText:     string;
  confidence:  number;
  parsedData:  unknown;
  processedAt: Date;
}

export interface IAttachment extends Document {
  _id:           Types.ObjectId;
  userId:        Types.ObjectId;
  transactionId?: Types.ObjectId;
  key:           string;
  url:           string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  originalName:  string;
  mimeType:      string;
  size:          number;
  category:      'receipt' | 'document' | 'other';
  ocrData?:      IOcrData;
  isDeleted:     boolean;
  deletedAt?:    Date;
  createdAt:     Date;
  updatedAt:     Date;
}

type AttachmentModelType = Model<IAttachment>;

const attachmentSchema = new Schema<IAttachment, AttachmentModelType>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', index: true },
    key:           { type: String, required: true },
    url:           { type: String, required: true },
    thumbnailKey:  { type: String },
    thumbnailUrl:  { type: String },
    originalName:  { type: String, required: true },
    mimeType:      { type: String, required: true },
    size:          { type: Number, required: true },
    category: {
      type:    String,
      enum:    ['receipt', 'document', 'other'],
      default: 'receipt',
    },
    ocrData: {
      rawText:     { type: String },
      confidence:  { type: Number },
      parsedData:  { type: Schema.Types.Mixed },
      processedAt: { type: Date },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

attachmentSchema.index({ userId: 1, isDeleted: 1 });
attachmentSchema.index({ transactionId: 1, isDeleted: 1 });

export const AttachmentModel = mongoose.model<IAttachment, AttachmentModelType>('Attachment', attachmentSchema);
export default AttachmentModel;
