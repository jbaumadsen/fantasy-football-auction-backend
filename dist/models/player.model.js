import mongoose, { Schema } from 'mongoose';
const PlayerSchema = new Schema({
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
export default mongoose.model('Player', PlayerSchema);
//# sourceMappingURL=player.model.js.map