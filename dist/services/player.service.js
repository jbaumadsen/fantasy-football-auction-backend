import { yahooApiService } from "./yahooApi.service.js";
import { AppError } from "../types/error.types.js";
import { logger } from "../utils/logger.utils.js";
import Player from "../models/player.model.js";
export class PlayerService {
    constructor() {
        this.lastUpdateTime = 0;
        this.UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    }
    async getPlayers(userId, leagueKey, limit = 100) {
        try {
            logger.log(`🔍 Fetching ${limit} players for league: ${leagueKey}`);
            // Check if we have recent data in database
            const dbPlayers = await this.getPlayersFromDatabase(limit);
            if (dbPlayers.length > 0) {
                logger.log(`✅ Returning ${dbPlayers.length} players from database`);
                return dbPlayers;
            }
            // If no database data, fetch from Yahoo
            logger.log("🔄 No recent database data, fetching from Yahoo...");
            return await this.fetchAllPlayersFromYahoo(userId, leagueKey, limit);
        }
        catch (error) {
            logger.error("❌ Error fetching players:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new AppError(`Failed to fetch players: ${errorMessage}`, 500);
        }
    }
    async updatePlayerDataInBackground(userId, leagueKey) {
        try {
            console.log("🔄 Starting background player data update...");
            // Fetch players from Yahoo API (first 100 players)
            const yahooPlayers = await yahooApiService.getPlayers(userId, leagueKey, {
                count: 100,
            });
            // TODO: Store/update players in database
            console.log(`✅ Updated ${yahooPlayers.length} players in background`);
            this.lastUpdateTime = Date.now();
        }
        catch (error) {
            console.error("❌ Background player update failed:", error);
            // Don't throw - this is background work
        }
    }
    transformYahooPlayers(yahooData, limit) {
        try {
            logger.log("🔄 Transforming Yahoo player data...");
            logger.log("Raw Yahoo data structure:", yahooData);
            // Yahoo returns players in a numbered key structure like "15": { "player": [...] }
            const playersNode = yahooData?.fantasy_content?.league?.[1]?.players;
            if (!playersNode || typeof playersNode !== "object") {
                logger.warn("⚠️ Players node not found in expected location");
                return [];
            }
            // Extract all numbered keys (excluding "count")
            const playerKeys = Object.keys(playersNode).filter((key) => key !== "count" && !isNaN(Number(key)));
            logger.log(`✅ Found ${playerKeys.length} player entries`);
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
            logger.log(`✅ Extracted ${allPlayers.length} players from numbered structure`);
            return this.extractPlayerData(allPlayers, limit);
        }
        catch (error) {
            logger.error("❌ Error transforming Yahoo data:", error);
            throw new AppError("Failed to transform Yahoo player data", 500);
        }
    }
    extractPlayerData(playersArray, limit) {
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
                    lastUpdated: new Date().toISOString(),
                    // Store the raw Yahoo data for debugging
                    rawYahooData: playerData,
                });
            }
        }
        logger.log(`✅ Transformed ${transformedPlayers.length} players`);
        return transformedPlayers;
    }
    async getPlayersFromDatabase(limit) {
        try {
            // Check if we have recent data (within 30 seconds for testing)
            const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
            const players = await Player.find({
                lastYahooSync: { $gte: thirtySecondsAgo }
            })
                .limit(limit)
                .sort({ name: 1 });
            return players;
        }
        catch (error) {
            logger.error("❌ Error fetching players from database:", error);
            return [];
        }
    }
    async storePlayersInDatabase(players) {
        const session = await Player.startSession();
        try {
            await session.withTransaction(async () => {
                logger.log(`💾 Storing ${players.length} players in database (transaction)...`);
                // Prepare all player data first
                const playerOperations = players.map(player => ({
                    updateOne: {
                        filter: { yahooPlayerKey: player.id },
                        update: {
                            $set: {
                                yahooPlayerKey: player.id,
                                yahooPlayerId: player.yahooId || '',
                                editorialPlayerKey: player.editorialKey || '',
                                name: player.name,
                                firstName: player.firstName || player.name.split(' ')[0],
                                lastName: player.lastName || player.name.split(' ').slice(1).join(' '),
                                displayPosition: player.position,
                                primaryPosition: player.position,
                                positionType: this.getPositionType(player.position),
                                eligiblePositions: [player.position],
                                editorialTeamKey: player.teamKey || '',
                                editorialTeamFullName: player.teamFullName || '',
                                editorialTeamAbbr: player.team,
                                status: player.status,
                                statusFull: player.statusFull || '',
                                injuryNote: player.injuryNote || '',
                                byeWeek: player.byeWeek,
                                uniformNumber: player.uniformNumber || '',
                                isUndroppable: false,
                                headshotUrl: player.headshotUrl || '',
                                imageUrl: player.imageUrl || '',
                                hasPlayerNotes: player.hasPlayerNotes || false,
                                playerNotesLastTimestamp: player.playerNotesTimestamp,
                                lastUpdated: new Date(),
                                lastYahooSync: new Date(),
                                rawYahooData: player.rawYahooData
                            }
                        },
                        upsert: true
                    }
                }));
                // Execute all operations in one atomic transaction
                const result = await Player.bulkWrite(playerOperations, { session });
                logger.log(`✅ Transaction successful: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
            });
            logger.log(`✅ Successfully stored ${players.length} players in database (atomic)`);
        }
        catch (error) {
            logger.error("❌ Transaction failed - rolling back all changes:", error);
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    getPositionType(position) {
        if (position === 'K')
            return 'K';
        if (position === 'DEF')
            return 'DEF';
        return 'O'; // Offense
    }
    getMockPlayers(limit) {
        // Mock data for testing - replace with actual DB query
        const positions = ["QB", "RB", "WR", "TE", "K", "DEF"];
        const players = [];
        for (let i = 1; i <= limit; i++) {
            const position = positions[i % positions.length];
            players.push({
                id: `player_${i}`,
                name: `Player ${i}`,
                position: position,
                team: `Team ${(i % 32) + 1}`,
                lastUpdated: new Date().toISOString(),
                // Add more fields as we discover Yahoo's structure
            });
        }
        return players;
    }
    async fetchAllPlayersFromYahoo(userId, leagueKey, limit = 100) {
        try {
            logger.log(`🚀 Starting full player sync for league: ${leagueKey}`);
            const allPlayers = [];
            let start = 0;
            const batchSize = 25; // Yahoo's default page size
            // Keep fetching until we get no more players or hit a reasonable maximum
            const maxPlayers = 2000; // Safety limit to prevent infinite loops
            while (allPlayers.length < maxPlayers) {
                logger.log(`📄 Fetching players ${start + 1}-${start + batchSize}...`);
                const yahooPlayers = await yahooApiService.getPlayers(userId, leagueKey, {
                    start: start,
                    count: batchSize
                });
                const transformedPlayers = this.transformYahooPlayers(yahooPlayers, batchSize);
                logger.log(`📊 Batch result: ${transformedPlayers.length} players from Yahoo API`);
                if (transformedPlayers.length === 0) {
                    logger.log("✅ No more players to fetch - Yahoo returned empty batch");
                    break;
                }
                // Store players in database
                await this.storePlayersInDatabase(transformedPlayers);
                allPlayers.push(...transformedPlayers);
                start += batchSize;
                logger.log(`📊 Total players fetched so far: ${allPlayers.length}`);
                // Small delay to be respectful to Yahoo's API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (allPlayers.length >= maxPlayers) {
                logger.warn(`⚠️ Hit safety limit of ${maxPlayers} players - may not have fetched all available players`);
                logger.warn(`💡 Consider increasing maxPlayers if you need more players`);
            }
            else {
                logger.log(`✅ Yahoo API returned no more players after ${allPlayers.length} total`);
            }
            logger.log(`🎉 Successfully synced ${allPlayers.length} players from Yahoo`);
            this.lastUpdateTime = Date.now();
            // Return the requested limit, but we've stored ALL players in the database
            return allPlayers.slice(0, limit);
        }
        catch (error) {
            logger.error("❌ Error in full player sync:", error);
            throw error;
        }
    }
}
export const playerService = new PlayerService();
export default playerService;
//# sourceMappingURL=player.service.js.map