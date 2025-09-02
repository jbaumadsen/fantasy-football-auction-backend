import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerValue extends Document {
  userId: string;           // Clerk user ID
  leagueKey: string;        // Normalized league key (nfl.l.XXXX)
  yahooPlayerKey: string;   // Player identifier (461.p.XXXX)
  playerName: string;       // Player name for debugging
  myValue: number | null;   // User's custom value (null = not set, 0 = explicitly set to 0)
  createdAt: Date;
  updatedAt: Date;
}

const PlayerValueSchema = new Schema<IPlayerValue>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  leagueKey: {
    type: String,
    required: true,
    index: true
  },
  yahooPlayerKey: {
    type: String,
    required: true,
    index: true
  },
  playerName: {
    type: String,
    required: true
  },
  myValue: {
    type: Number,
    default: null,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
PlayerValueSchema.index({ userId: 1, leagueKey: 1, yahooPlayerKey: 1 }, { unique: true });

export default mongoose.model<IPlayerValue>('PlayerValue', PlayerValueSchema);
