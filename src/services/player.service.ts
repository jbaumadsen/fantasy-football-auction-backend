import { yahooApiService } from "./yahooApi.service.js";
import { AppError } from "../types/error.types.js";
import { logger } from "../utils/logger.utils.js";
import Player, { IPlayer } from "../models/player.model.js";
import PlayerAnalysis from "../models/playerAnalysis.model.js";
import PlayerValue from "../models/playerValue.model.js";

export class PlayerService {

  async getPlayers(
    userId: string,
    leagueKey: string,
    limit: number = 100
  ): Promise<any[]> {
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
    } catch (error) {
      logger.error("❌ Error fetching players:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new AppError(
        `Failed to fetch players: ${errorMessage}`,
        500
      );
    }
  }

  private transformYahooPlayers(yahooData: any, limit: number): any[] {
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
      const playerKeys = Object.keys(playersNode).filter(
        (key) => key !== "count" && !isNaN(Number(key))
      );
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

      logger.log(
        `✅ Extracted ${allPlayers.length} players from numbered structure`
      );
      return this.extractPlayerData(allPlayers, limit);
    } catch (error) {
      logger.error("❌ Error transforming Yahoo data:", error);
      throw new AppError("Failed to transform Yahoo player data", 500);
    }
  }

  /**
   * Return players enriched with league-specific draft analysis (average draft value).
   * - Ensures players exist (DB or Yahoo fetch)
   * - Joins on PlayerAnalysis by fantasyLeagueId + yahooPlayerKey
   */
  async getPlayersWithAnalyses(
    userId: string,
    leagueKey: string,
    limit: number = 100
  ): Promise<any[]> {
    console.log('🔍 getPlayersWithAnalyses service called:', { userId, leagueKey, limit });
    
    // Normalize league key format (461.l.476219 -> nfl.l.476219)
    const normalizedLeagueKey = this.normalizeLeagueKey(leagueKey);
    console.log('🔄 Normalized league key:', normalizedLeagueKey);
    
    // Get base players directly from database (already synced)
    console.log('📊 Getting base players from database...');
    const basePlayers = await Player.find({})
      .limit(limit)
      .lean();
    console.log('📊 Base players count:', basePlayers?.length || 0);

    if (!basePlayers || basePlayers.length === 0) {
      console.log('❌ No base players found, returning empty array');
      return [];
    }

    // Collect keys and fetch analyses for this league
    const keys = basePlayers
      .map((p: any) => p.yahooPlayerKey || p.yahooPlayerId || p.yahooPlayerKey)
      .filter(Boolean);
    console.log('🔑 Player keys to lookup:', keys.length);

    console.log('📊 Fetching analyses for normalized league:', normalizedLeagueKey);
    const analyses = await PlayerAnalysis.find({
      fantasyLeagueId: normalizedLeagueKey,
      yahooPlayerKey: { $in: keys },
    }).lean();
    console.log('📊 Analyses found:', analyses.length);

    const keyToAnalysis: Record<string, any> = {};
    for (const a of analyses) {
      keyToAnalysis[a.yahooPlayerKey] = a;
    }
    
    console.log('🔑 Analysis keys available:', Object.keys(keyToAnalysis).slice(0, 5));
    console.log('🔑 Sample player keys to lookup:', keys.slice(0, 5));

    // Get user's custom values for this league
    console.log('💰 Fetching user custom values for league:', normalizedLeagueKey);
    const playerValues = await PlayerValue.find({
      userId,
      leagueKey: normalizedLeagueKey
    }).lean();
    
    const valueMap: Record<string, number | null> = {};
    playerValues.forEach(pv => {
      valueMap[pv.yahooPlayerKey] = pv.myValue;
    });
    console.log('💰 User custom values found:', playerValues.length);

    // Enrich players with average draft value (prefer averageCost; fallback preseasonAverageCost)
    let debugCount = 0;
    const enriched = basePlayers.map((p: any) => {
      const key = p.yahooPlayerKey || p.yahooPlayerId || p.yahooPlayerKey;
      const a = keyToAnalysis[key];
      const avgCostStr = a?.averageCost && a.averageCost !== "-" ? a.averageCost : a?.preseasonAverageCost;
      const averageDraftValue = avgCostStr && avgCostStr !== "-" ? Number(avgCostStr) : null;
      
      // Debug logging for first few players
      if (debugCount < 3) {
        console.log(`🔍 Player ${p.name} (${key}):`, {
          hasAnalysis: !!a,
          averageCost: a?.averageCost,
          preseasonAverageCost: a?.preseasonAverageCost,
          avgCostStr,
          averageDraftValue
        });
        debugCount++;
      }
      
      return {
        ...p,
        // Map fields to expected frontend format
        position: p.displayPosition || p.primaryPosition,
        team: p.editorialTeamAbbr,
        averageDraftValue,
        myValue: valueMap[key] || null,
      };
    });

    console.log('✅ Returning enriched players:', enriched.length);
    return enriched;
  }

  /**
   * Normalize league key format from Yahoo format to standard format
   * Converts "461.l.476219" to "nfl.l.476219"
   */
  private normalizeLeagueKey(leagueKey: string): string {
    const match = leagueKey.match(/^(\d+)\.l\.(\d+)$/i);
    if (match) {
      return `nfl.l.${match[2]}`;
    }
    return leagueKey; // Return as-is if already normalized or different format
  }

  private extractPlayerData(playersArray: any[], limit: number): any[] {
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
        if (item.player_key) playerKey = item.player_key;
        if (item.player_id) playerId = item.player_id;
        if (item.name?.full) playerName = item.name.full;
        if (item.name?.first) firstName = item.name.first;
        if (item.name?.last) lastName = item.name.last;
        if (item.display_position) playerPosition = item.display_position;
        if (item.editorial_team_abbr) playerTeam = item.editorial_team_abbr;
        if (item.editorial_team_full_name) playerTeamFull = item.editorial_team_full_name;
        if (item.editorial_team_key) playerTeamKey = item.editorial_team_key;
        if (item.status) playerStatus = item.status;
        if (item.bye_weeks?.week) playerByeWeek = item.bye_weeks.week;
        if (item.uniform_number) uniformNumber = item.uniform_number;
        if (item.headshot?.url) headshotUrl = item.headshot.url;
        if (item.image_url) imageUrl = item.image_url;
        if (item.has_player_notes) hasPlayerNotes = item.has_player_notes === 1;
        if (item.player_notes_last_timestamp) playerNotesTimestamp = item.player_notes_last_timestamp;
        if (item.editorial_player_key) editorialKey = item.editorial_player_key;
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

  private async getPlayersFromDatabase(limit: number): Promise<any[]> {
    try {
      // Check if we have recent data (within 30 seconds for testing)
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      
      const players = await Player.find({
        lastYahooSync: { $gte: thirtySecondsAgo }
      })
      .limit(limit)
      .sort({ name: 1 });
      
      return players;
    } catch (error) {
      logger.error("❌ Error fetching players from database:", error);
      return [];
    }
  }

  private async storePlayersInDatabase(players: any[]): Promise<void> {
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
    } catch (error) {
      logger.error("❌ Transaction failed - rolling back all changes:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private getPositionType(position: string): string {
    if (position === 'K') return 'K';
    if (position === 'DEF') return 'DEF';
    return 'O'; // Offense
  }

  async fetchAllPlayersFromYahoo(userId: string, leagueKey: string, limit: number = 100): Promise<any[]> {
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
      } else {
        logger.log(`✅ Yahoo API returned no more players after ${allPlayers.length} total`);
      }
      
      logger.log(`🎉 Successfully synced ${allPlayers.length} players from Yahoo`);
      
      // Return the requested limit, but we've stored ALL players in the database
      return allPlayers.slice(0, limit);
    } catch (error) {
      logger.error("❌ Error in full player sync:", error);
      throw error;
    }
  }
}

export const playerService = new PlayerService();
export default playerService;
