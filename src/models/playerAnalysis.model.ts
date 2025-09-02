import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerAnalysis extends Document {
  // League reference
  fantasyLeagueId: string;      // "nfl.l.476219" - the fantasy league ID
  
  // Player identifier
  yahooPlayerKey: string;       // "461.p.7200" (league.player_id)

  playerName: string;
  
  // Draft analysis data (league-specific)
  averagePick: string;          // "119.0" or "-" if not available
  averageRound: string;         // "12.5" or "-" if not available
  averageCost: string;          // "1.8" or "-" if not available

  percentDrafted: string;
  preseasonAveragePick: string;
  preseasonAverageRound: string;
  preseasonAverageCost: string;
  preseasonPercentDrafted: string;
  
  // Metadata
  lastUpdated: Date;
  lastYahooSync: Date;
}

const PlayerAnalysisSchema = new Schema<IPlayerAnalysis>({
  fantasyLeagueId: {
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
    required: true,
    index: true
  },
  
  // Draft analysis fields (league-specific)
  averagePick: {
    type: String,
    default: "-"
  },
  averageRound: {
    type: String,
    default: "-"
  },
  averageCost: {
    type: String,
    default: "-"
  },
  percentDrafted: {
    type: String,
    default: "-"
  },
  
  // Preseason draft analysis fields
  preseasonAveragePick: {
    type: String,
    default: "-"
  },
  preseasonAverageRound: {
    type: String,
    default: "-"
  },
  preseasonAverageCost: {
    type: String,
    default: "-"
  },
  preseasonPercentDrafted: {
    type: String,
    default: "-"
  },
  
  // Metadata fields
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastYahooSync: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
PlayerAnalysisSchema.index({ fantasyLeagueId: 1, yahooPlayerKey: 1 }, { unique: true });
PlayerAnalysisSchema.index({ fantasyLeagueId: 1, displayPosition: 1 });
PlayerAnalysisSchema.index({ fantasyLeagueId: 1, editorialTeamAbbr: 1 });
PlayerAnalysisSchema.index({ lastYahooSync: 1 });

export default mongoose.model<IPlayerAnalysis>('PlayerAnalysis', PlayerAnalysisSchema);
