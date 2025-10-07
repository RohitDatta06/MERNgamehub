import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  slug: string;        // unique ID (e.g., "snake", "tetris")
  title: string;       // display name
  description: string; // what the game is about
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<IGame>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

gameSchema.index({ slug: 1 });

export const Game = mongoose.model<IGame>('Game', gameSchema);