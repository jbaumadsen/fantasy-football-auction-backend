import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  // Yahoo identifiers
  yahooPlayerKey: string;        // "461.p.25785" (league.player_id)
  yahooPlayerId: string;         // "25785"
  editorialPlayerKey: string;    // "nfl.p.25785"
  
  // Basic info
  name: string;                  // "Russell Wilson"
  firstName: string;             // "Russell"
  lastName: string;              // "Wilson"
  
  // Position info
  displayPosition: string;       // "QB"
  primaryPosition: string;       // "QB"
  positionType: string;          // "O" (offense), "K", "DEF"
  eligiblePositions: string[];   // ["QB"]
  
  // Team info
  editorialTeamKey: string;      // "nfl.t.19"
  editorialTeamFullName: string; // "New York Giants"
  editorialTeamAbbr: string;     // "NYG"
  
  // Status info
  status: string;                // "Active", "NA", "Q", "SUSP"
  statusFull: string;            // "Inactive: Coach's Decision or Not on Roster"
  injuryNote?: string;           // "Knee - Meniscus"
  
  // League info
  byeWeek: string;               // "14"
  uniformNumber: string;         // "3" or ""
  isUndroppable: boolean;        // false
  
  // Media
  headshotUrl?: string;
  imageUrl?: string;
  
  // Player notes (if any)
  hasPlayerNotes: boolean;
  playerNotesLastTimestamp?: number;
  
  // Metadata
  lastUpdated: Date;
  lastYahooSync: Date;
  
  // Raw Yahoo data for debugging
  rawYahooData: any;
}

const PlayerSchema = new Schema<IPlayer>({
  yahooPlayerKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  yahooPlayerId: {
    type: String,
    required: true,
    index: true
  },
  editorialPlayerKey: {
    type: String,
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  
  displayPosition: {
    type: String,
    required: true,
    index: true
  },
  primaryPosition: {
    type: String,
    required: true
  },
  positionType: {
    type: String,
    required: true
  },
  eligiblePositions: [{
    type: String
  }],
  
  editorialTeamKey: {
    type: String,
    required: true,
    index: true
  },
  editorialTeamFullName: {
    type: String,
    required: true
  },
  editorialTeamAbbr: {
    type: String,
    required: true,
    index: true
  },
  
  status: {
    type: String,
    required: true,
    default: 'Active',
    index: true
  },
  statusFull: {
    type: String
  },
  injuryNote: {
    type: String
  },
  
  byeWeek: {
    type: String
  },
  uniformNumber: {
    type: String
  },
  isUndroppable: {
    type: Boolean,
    default: false
  },
  
  headshotUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  
  hasPlayerNotes: {
    type: Boolean,
    default: false
  },
  playerNotesLastTimestamp: {
    type: Number
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastYahooSync: {
    type: Date,
    default: Date.now
  },
  
  rawYahooData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for common queries
PlayerSchema.index({ displayPosition: 1, name: 1 });
PlayerSchema.index({ editorialTeamAbbr: 1, displayPosition: 1 });
PlayerSchema.index({ status: 1, displayPosition: 1 });
PlayerSchema.index({ lastYahooSync: 1 });

export default mongoose.model<IPlayer>('Player', PlayerSchema);
