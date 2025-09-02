import { yahooApiService } from "./yahooApi.service.js";
import { AppError } from "../types/error.types.js";
import { logger } from "../utils/logger.utils.js";
export class DraftService {
    /**
     * Get players with draft analysis data (includes average auction $ and ADP)
     * This is the data that IS available from Yahoo's API
     */
    async getPlayersWithDraftAnalysis(userId, leagueKey, limit = 100) {
        try {
            logger.log(`📊 Fetching ${limit} players with draft analysis for league: ${leagueKey}`);
            const yahooPlayers = await yahooApiService.getPlayersWithProjections(userId, leagueKey, {
                count: limit
            });
            const transformedPlayers = this.transformYahooPlayersWithDraftAnalysis(yahooPlayers, limit);
            return transformedPlayers;
        }
        catch (error) {
            logger.error("❌ Error fetching players with draft analysis:", error);
            throw error;
        }
    }
    /**
     * Get draft results for the league (includes actual auction prices)
     * This is post-draft data showing what players actually sold for
     */
    async getLeagueDraftResults(userId, leagueKey) {
        try {
            logger.log(`💰 Fetching draft results for league: ${leagueKey}`);
            const draftResults = await yahooApiService.getLeagueDraftResults(userId, leagueKey);
            return this.transformDraftResults(draftResults);
        }
        catch (error) {
            logger.error("❌ Error fetching draft results:", error);
            throw error;
        }
    }
    /**
     * Get league settings including auction budget and draft settings
     */
    async getLeagueSettings(userId, leagueKey) {
        try {
            logger.log(`⚙️ Fetching league settings for league: ${leagueKey}`);
            const settings = await yahooApiService.getLeagueSettings(userId, leagueKey);
            return this.transformLeagueSettings(settings);
        }
        catch (error) {
            logger.error("❌ Error fetching league settings:", error);
            throw error;
        }
    }
    /**
     * Get league teams and their current auction budgets
     */
    async getLeagueTeams(userId, leagueKey) {
        try {
            logger.log(`👥 Fetching league teams for league: ${leagueKey}`);
            const teams = await yahooApiService.getLeagueTeams(userId, leagueKey);
            return this.transformLeagueTeams(teams);
        }
        catch (error) {
            logger.error("❌ Error fetching league teams:", error);
            throw error;
        }
    }
    /**
     * Transform Yahoo player data with draft analysis
     */
    transformYahooPlayersWithDraftAnalysis(yahooData, limit) {
        try {
            // Yahoo returns players in a numbered key structure like "15": { "player": [...] }
            const playersNode = yahooData?.fantasy_content?.league?.[1]?.players;
            if (!playersNode || typeof playersNode !== "object") {
                return [];
            }
            // Extract all numbered keys (excluding "count")
            const playerKeys = Object.keys(playersNode).filter((key) => key !== "count" && !isNaN(Number(key)));
            const allPlayers = [];
            for (const key of playerKeys) {
                const playerEntry = playersNode[key];
                if (playerEntry?.player && Array.isArray(playerEntry.player)) {
                    // Each player entry contains an array of player data
                    // But Yahoo wraps it in ANOTHER array, so we need player[0]
                    const playerData = playerEntry.player[0];
                    if (Array.isArray(playerData)) {
                        allPlayers.push(playerData);
                    }
                }
            }
            return this.extractPlayerDataWithDraftAnalysis(allPlayers, limit);
        }
        catch (error) {
            logger.error("❌ Error transforming Yahoo data with draft analysis:", error);
            throw new AppError("Failed to transform Yahoo player data with draft analysis", 500);
        }
    }
    /**
     * Transform draft results data
     */
    transformDraftResults(yahooData) {
        try {
            // Yahoo returns draft results in a numbered key structure like "15": { "player": [...] }
            const draftResultsNode = yahooData?.fantasy_content?.league?.[1]?.draft_results;
            if (!draftResultsNode || typeof draftResultsNode !== "object") {
                return [];
            }
            // Extract all numbered keys (excluding "count")
            const playerKeys = Object.keys(draftResultsNode).filter((key) => key !== "count" && !isNaN(Number(key)));
            const allDraftResults = [];
            for (const key of playerKeys) {
                const playerEntry = draftResultsNode[key];
                if (playerEntry?.player && Array.isArray(playerEntry.player)) {
                    // Each player entry contains an array of player data
                    // But Yahoo wraps it in ANOTHER array, so we need player[0]
                    const playerData = playerEntry.player[0];
                    if (Array.isArray(playerData)) {
                        allDraftResults.push(playerData);
                    }
                }
            }
            return this.extractDraftResultData(allDraftResults);
        }
        catch (error) {
            logger.error("❌ Error transforming draft results:", error);
            throw new AppError("Failed to transform draft results", 500);
        }
    }
    /**
     * Extract player data with draft analysis fields
     */
    extractPlayerDataWithDraftAnalysis(playersArray, limit) {
        const transformedPlayers = [];
        for (let i = 0; i < Math.min(playersArray.length, limit); i++) {
            const playerData = playersArray[i];
            // Each player is an array of key-value pairs from Yahoo
            // We need to extract the relevant fields from this array
            let playerKey = "";
            let playerId = "";
            let playerName = "";
            let firstName = "";
            let lastName = "";
            let playerPosition = "";
            let playerTeam = "";
            let playerTeamFull = "";
            let playerTeamKey = "";
            let playerStatus = "";
            let playerByeWeek = "";
            let uniformNumber = "";
            let headshotUrl = "";
            let imageUrl = "";
            let hasPlayerNotes = false;
            let playerNotesTimestamp = 0;
            let editorialKey = "";
            let averageAuctionValue = 0;
            let averageDraftPosition = 0;
            // Extract data from the array structure
            for (const item of playerData) {
                if (item.player_key)
                    playerKey = item.player_key;
                if (item.player_id)
                    playerId = item.player_id;
                if (item.name?.full)
                    playerName = item.name.full;
                if (item.name?.first)
                    firstName = item.name.first;
                if (item.name?.last)
                    lastName = item.name.last;
                if (item.display_position)
                    playerPosition = item.display_position;
                if (item.editorial_team_abbr)
                    playerTeam = item.editorial_team_abbr;
                if (item.editorial_team_full_name)
                    playerTeamFull = item.editorial_team_full_name;
                if (item.editorial_team_key)
                    playerTeamKey = item.editorial_team_key;
                if (item.status)
                    playerStatus = item.status;
                if (item.bye_weeks?.week)
                    playerByeWeek = item.bye_weeks.week;
                if (item.uniform_number)
                    uniformNumber = item.uniform_number;
                if (item.headshot?.url)
                    headshotUrl = item.headshot.url;
                if (item.image_url)
                    imageUrl = item.image_url;
                if (item.has_player_notes)
                    hasPlayerNotes = item.has_player_notes === 1;
                if (item.player_notes_last_timestamp)
                    playerNotesTimestamp = item.player_notes_last_timestamp;
                if (item.editorial_player_key)
                    editorialKey = item.editorial_player_key;
                if (item.average_auction_value)
                    averageAuctionValue = item.average_auction_value;
                if (item.average_draft_position)
                    averageDraftPosition = item.average_draft_position;
            }
            if (playerKey && playerName) {
                transformedPlayers.push({
                    id: playerKey,
                    yahooId: playerId,
                    editorialKey: editorialKey,
                    name: playerName,
                    firstName: firstName || playerName.split(' ')[0],
                    lastName: lastName || playerName.split(' ').slice(1).join(' '),
                    position: playerPosition || "Unknown",
                    team: playerTeam || "Unknown",
                    teamFullName: playerTeamFull || "",
                    teamKey: playerTeamKey || "",
                    status: playerStatus || "Active",
                    byeWeek: playerByeWeek || "Unknown",
                    uniformNumber: uniformNumber || "",
                    headshotUrl: headshotUrl || "",
                    imageUrl: imageUrl || "",
                    hasPlayerNotes: hasPlayerNotes,
                    playerNotesTimestamp: playerNotesTimestamp,
                    averageAuctionValue: averageAuctionValue,
                    averageDraftPosition: averageDraftPosition,
                    lastUpdated: new Date().toISOString(),
                    // Store the raw Yahoo data for debugging
                    rawYahooData: playerData,
                });
            }
        }
        return transformedPlayers;
    }
    /**
     * Extract draft result data
     */
    extractDraftResultData(draftResultsArray) {
        const transformedResults = [];
        for (const playerData of draftResultsArray) {
            let playerKey = "";
            let playerId = "";
            let playerName = "";
            let playerPosition = "";
            let playerTeam = "";
            let playerTeamFull = "";
            let playerTeamKey = "";
            let auctionPrice = 0;
            let draftRound = 0;
            let draftPick = 0;
            let draftTimestamp = 0;
            for (const item of playerData) {
                if (item.player_key)
                    playerKey = item.player_key;
                if (item.player_id)
                    playerId = item.player_id;
                if (item.name?.full)
                    playerName = item.name.full;
                if (item.display_position)
                    playerPosition = item.display_position;
                if (item.editorial_team_abbr)
                    playerTeam = item.editorial_team_abbr;
                if (item.editorial_team_full_name)
                    playerTeamFull = item.editorial_team_full_name;
                if (item.editorial_team_key)
                    playerTeamKey = item.editorial_team_key;
                if (item.auction_price)
                    auctionPrice = item.auction_price;
                if (item.draft_round)
                    draftRound = item.draft_round;
                if (item.draft_pick)
                    draftPick = item.draft_pick;
                if (item.draft_timestamp)
                    draftTimestamp = item.draft_timestamp;
            }
            if (playerKey && playerName) {
                transformedResults.push({
                    id: playerKey,
                    yahooId: playerId,
                    name: playerName,
                    position: playerPosition || "Unknown",
                    team: playerTeam || "Unknown",
                    teamFullName: playerTeamFull || "",
                    teamKey: playerTeamKey || "",
                    auctionPrice: auctionPrice,
                    draftRound: draftRound,
                    draftPick: draftPick,
                    draftTimestamp: draftTimestamp,
                    lastUpdated: new Date().toISOString(),
                    rawYahooData: playerData,
                });
            }
        }
        return transformedResults;
    }
    /**
     * Transform league settings data
     */
    transformLeagueSettings(settings) {
        try {
            const leagueNode = settings?.fantasy_content?.league?.[1];
            if (!leagueNode) {
                return {};
            }
            return {
                leagueKey: leagueNode.league_key,
                leagueName: leagueNode.name,
                leagueType: leagueNode.league_type,
                season: leagueNode.season,
                numTeams: leagueNode.num_teams,
                draftType: leagueNode.draft_type,
                auctionBudget: leagueNode.auction_budget || 0,
                scoringType: leagueNode.scoring_type,
                rosterPositions: leagueNode.roster_positions,
                rawSettings: leagueNode
            };
        }
        catch (error) {
            logger.error("❌ Error transforming league settings:", error);
            return {};
        }
    }
    /**
     * Transform league teams data
     */
    transformLeagueTeams(teams) {
        try {
            const teamsNode = teams?.fantasy_content?.league?.[1]?.teams;
            if (!teamsNode || typeof teamsNode !== "object") {
                return [];
            }
            const teamKeys = Object.keys(teamsNode).filter((key) => key !== "count" && !isNaN(Number(key)));
            const transformedTeams = [];
            for (const key of teamKeys) {
                const teamEntry = teamsNode[key];
                if (teamEntry?.team && Array.isArray(teamEntry.team)) {
                    const teamData = teamEntry.team[0];
                    let teamKey = "";
                    let teamName = "";
                    let teamId = "";
                    let managerName = "";
                    for (const item of teamData) {
                        if (item.team_key)
                            teamKey = item.team_key;
                        if (item.name)
                            teamName = item.name;
                        if (item.team_id)
                            teamId = item.team_id;
                        if (item.managers?.[0]?.manager?.name)
                            managerName = item.managers[0].manager.name;
                    }
                    if (teamKey && teamName) {
                        transformedTeams.push({
                            teamKey,
                            teamName,
                            teamId,
                            managerName,
                            rawTeamData: teamData
                        });
                    }
                }
            }
            return transformedTeams;
        }
        catch (error) {
            logger.error("❌ Error transforming league teams:", error);
            return [];
        }
    }
}
export const draftService = new DraftService();
export default draftService;
//# sourceMappingURL=draft.service.js.map