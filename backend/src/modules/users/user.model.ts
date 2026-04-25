import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ── Subdocument interface ────────────────────────────────
export interface IRefreshToken {
  tokenHash: string;
  expiresAt: Date;
}

// ── Instance methods ─────────────────────────────────────
export interface IUserMethods {
  isLocked(): boolean;
  incrementFailedLogins(): Promise<void>;
  resetFailedLogins(): Promise<void>;
}

// ── Main document interface ──────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  avatarKey?: string;
  googleId?: string;
  role: 'user' | 'admin';
  coachState: 0 | 1 | 2;
  coachStateUpdatedAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  refreshTokens: IRefreshToken[];
  isDeleted: boolean;
  deletedAt?: Date;
  lowBalanceThreshold: number;
  largeTransactionAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

type UserModelType = Model<IUser, object, IUserMethods>;

// ── Refresh token subdocument schema ─────────────────────
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

// ── User schema ──────────────────────────────────────────
const userSchema = new Schema<IUser, UserModelType, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    avatarUrl:  { type: String },
    avatarKey:  { type: String },
    googleId: { type: String, sparse: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    coachState: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    coachStateUpdatedAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    refreshTokens: [refreshTokenSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    lowBalanceThreshold: { type: Number, default: 10000 },
    largeTransactionAmount: { type: Number, default: 50000 },
  },
  { timestamps: true },
);

// ── Indexes ──────────────────────────────────────────────
// Indexes for email and googleId are automatically created by unique: true and sparse: true in schema.


// ── Instance methods ─────────────────────────────────────

userSchema.methods.isLocked = function (): boolean {
  return this.lockedUntil != null && this.lockedUntil > new Date();
};

userSchema.methods.incrementFailedLogins = async function (): Promise<void> {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    // Lock account for 30 minutes
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  await this.save();
};

userSchema.methods.resetFailedLogins = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  await this.save();
};

// ── Model ────────────────────────────────────────────────
export const UserModel = mongoose.model<IUser, UserModelType>('User', userSchema);
export default UserModel;
