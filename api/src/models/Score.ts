// models/Score.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScore extends Document {
  userId: Types.ObjectId;
  gameSlug: string;
  value: number;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const scoreSchema = new Schema<IScore>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameSlug: { type: String, required: true, index: true },
    value: { type: Number, required: true, min: 0 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

scoreSchema.index({ gameSlug: 1, value: -1 });
scoreSchema.index({ userId: 1, gameSlug: 1 });

export const Score = mongoose.model<IScore>('Score', scoreSchema);
