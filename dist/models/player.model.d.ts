import mongoose, { Document } from 'mongoose';
export interface IPlayer extends Document {
    yahooPlayerKey: string;
    yahooPlayerId: string;
    editorialPlayerKey: string;
    name: string;
    firstName: string;
    lastName: string;
    displayPosition: string;
    primaryPosition: string;
    positionType: string;
    eligiblePositions: string[];
    editorialTeamKey: string;
    editorialTeamFullName: string;
    editorialTeamAbbr: string;
    status: string;
    statusFull: string;
    injuryNote?: string;
    byeWeek: string;
    uniformNumber: string;
    isUndroppable: boolean;
    headshotUrl?: string;
    imageUrl?: string;
    hasPlayerNotes: boolean;
    playerNotesLastTimestamp?: number;
    lastUpdated: Date;
    lastYahooSync: Date;
    rawYahooData: any;
}
declare const _default: mongoose.Model<IPlayer, {}, {}, {}, mongoose.Document<unknown, {}, IPlayer, {}, {}> & IPlayer & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=player.model.d.ts.map