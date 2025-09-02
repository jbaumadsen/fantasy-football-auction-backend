import { yahooApiService } from "./yahooApi.service.js";
import { AppError } from "../types/error.types.js";
import { logger } from "../utils/logger.utils.js";
import PlayerAnalysis from "../models/playerAnalysis.model.js";
// import { PlayerAnalysisInput, YahooLeaguePlayersResponse } from "../types/draftAnalysis.types.js";

export class DraftService {
  /**
   * Get and update player draft analysis data for all available players
   * This method will paginate through all available players and store their analyses
   */
  async getAndUpdatePlayerDraftAnalysisFromYahoo(
    userId: string,
    leagueKey: string
  ): Promise<{ totalFetched: number; totalStored: number; errors: string[] }> {
    console.log("line 43 in draft.service.ts getAndUpdatePlayerDraftAnalysis");

    const batchSize = 25;
    try {
      console.log(
        `🔄 Starting bulk fetch and store of player analyses for league: ${leagueKey}`
      );

      let totalFetched = 0;
      let totalStored = 0;
      let start = 0;
      let hasMore = true;
      const errors: string[] = [];

      // Rate limiting configuration
      const RATE_LIMIT_DELAY_MS = 1000; // 1 second between API calls
      const BATCH_PROCESSING_DELAY_MS = 500; // 500ms between batches
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 2000; // 2 seconds before retry

      while (hasMore) {
        try {
          console.log(
            `📥 Fetching batch starting at ${start} with size ${batchSize}`
          );
          console.log(
            "line 62 in draft.service.ts getAndUpdatePlayerDraftAnalysis"
          );

          // Rate limiting: wait before making API call
          if (start > 0) {
            console.log(
              `⏳ Rate limiting: waiting ${RATE_LIMIT_DELAY_MS}ms before next API call`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, RATE_LIMIT_DELAY_MS)
            );
          }

          let yahooPlayers;
          let retryCount = 0;

          // Retry logic with exponential backoff
          while (retryCount < MAX_RETRIES) {
            try {
              yahooPlayers = await yahooApiService.getPlayersWithDraftAnalysis(
                userId,
                leagueKey,
                {
                  start,
                  count: batchSize,
                }
              );
              break; // Success, exit retry loop
            } catch (apiError) {
              retryCount++;
              if (retryCount >= MAX_RETRIES) {
                throw apiError; // Give up after max retries
              }

              const backoffDelay = RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
              console.log(
                `⚠️ API call failed, retrying in ${backoffDelay}ms (attempt ${retryCount}/${MAX_RETRIES})`
              );
              await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            }
          }

          // const stringifiedYahooPlayers = JSON.stringify(yahooPlayers);
          // logger.log('line 94 in draft.service.ts fetchAndStoreAllPlayerAnalyses stringifiedYahooPlayers', yahooPlayers);

          const playersNode =
            yahooPlayers?.fantasy_content?.league?.[1]?.players;
          console.log(`🔍 Yahoo API response structure:`, {
            hasFantasyContent: !!yahooPlayers?.fantasy_content,
            hasLeague: !!yahooPlayers?.fantasy_content?.league,
            leagueLength: yahooPlayers?.fantasy_content?.league?.length,
            hasPlayers: !!playersNode,
            playersType: typeof playersNode,
            startPosition: start,
          });

          if (!playersNode || typeof playersNode !== "object") {
            console.log(`📭 No more players found at start position ${start}`);
            hasMore = false;
            break;
          }

          const playerKeys = Object.keys(playersNode).filter(
            (key) => key !== "count" && !isNaN(Number(key))
          );

          console.log(`🔑 Extracted player keys:`, {
            totalKeys: Object.keys(playersNode).length,
            countKey: playersNode.count,
            numericKeys: playerKeys,
            playerKeysLength: playerKeys.length,
          });

          if (playerKeys.length === 0) {
            console.log(
              "line 105 in draft.service.ts getAndUpdatePlayerDraftAnalysis no players in batch"
            );
            console.log(`📭 No players in batch at start position ${start}`);
            hasMore = false;
            break;
          }

          console.log(
            `📊 Processing ${playerKeys.length} players in current batch`
          );

          // Process each player in the batch
          for (const key of playerKeys) {
            try {
              const playerEntry = playersNode[key];
              if (playerEntry?.player && Array.isArray(playerEntry.player)) {
                const playerData = playerEntry.player;
                logger.log(
                  "line 139 in draft.service.ts fetchAndStoreAllPlayerAnalyses playerData",
                  playerData
                );
                const draftAnalysis = playerData[1];
                const playerKey = playerData[0][0].player_key;
                const playerName = playerData[0][2].name.full;
                const averagePick =
                  draftAnalysis.draft_analysis[0].average_pick || 0;
                const averageRound =
                  draftAnalysis.draft_analysis[1].average_round || 0;
                const averageCost =
                  draftAnalysis.draft_analysis[2].average_cost || 0;
                const percentDrafted =
                  draftAnalysis.draft_analysis[3].percent_drafted || 0;
                const preseasonAveragePick =
                  draftAnalysis.draft_analysis[4].preseason_average_pick || 0;
                const preseasonAverageRound =
                  draftAnalysis.draft_analysis[5].preseason_average_round || 0;
                const preseasonAverageCost =
                  draftAnalysis.draft_analysis[6].preseason_average_cost || 0;
                const preseasonPercentDrafted =
                  draftAnalysis.draft_analysis[7].preseason_percent_drafted ||
                  0;

                // logger.log('line 151 in draft.service.ts fetchAndStoreAllPlayerAnalyses draftAnalysis', draftAnalysis);

                // stringify draftAnalysis and add it to the log file not the console
                // const stringifiedDraftAnalysis = JSON.stringify(draftAnalysis);
                // logger.log('line 143 in draft.service.ts fetchAndStoreAllPlayerAnalyses stringifiedDraftAnalysis', stringifiedDraftAnalysis);

                if (
                  Array.isArray(playerData) &&
                  draftAnalysis?.draft_analysis
                ) {
                  const playerAnalysis = {
                    playerKey,
                    leagueKey,
                    playerName,
                    averagePick,
                    averageRound,
                    averageCost,
                    percentDrafted,
                    preseasonAveragePick,
                    preseasonAverageRound,
                    preseasonAverageCost,
                    preseasonPercentDrafted,
                  };

                  // logger.log('line 172 in draft.service.ts fetchAndStoreAllPlayerAnalyses playerAnalysis', playerAnalysis);

                  if (playerAnalysis) {
                    // Use upsert to avoid duplicates
                    await PlayerAnalysis.findOneAndUpdate(
                      {
                        fantasyLeagueId: leagueKey,
                        yahooPlayerKey: playerKey,
                      },
                      {
                        fantasyLeagueId: leagueKey,
                        yahooPlayerKey: playerKey,
                        playerName: playerName,
                        averagePick: averagePick,
                        averageRound: averageRound,
                        averageCost: averageCost,
                        percentDrafted: percentDrafted,
                        preseasonAveragePick: preseasonAveragePick,
                        preseasonAverageRound: preseasonAverageRound,
                        preseasonAverageCost: preseasonAverageCost,
                        preseasonPercentDrafted: preseasonPercentDrafted,
                      },
                      { upsert: true, new: true }
                    );
                    totalStored++;
                  }
                  totalFetched++;
                }
              }
            } catch (playerError) {
              const errorMsg = `Error processing player at key ${key}: ${playerError}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          }

          // Move to next batch
          start += batchSize;

          // Check if we've reached the end
          console.log(
            `📊 Batch completed: ${playerKeys.length} players, batchSize: ${batchSize}, start now: ${start}`
          );

          if (playerKeys.length < batchSize) {
            console.log(
              `🏁 Reached end of available players (${playerKeys.length} < ${batchSize})`
            );
            hasMore = false;
          } else {
            console.log(`🔄 Continuing to next batch at position ${start}`);
          }

          // Rate limiting: wait between batches to avoid overwhelming the API
          if (hasMore) {
            console.log(
              `⏳ Rate limiting: waiting ${BATCH_PROCESSING_DELAY_MS}ms before next batch`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, BATCH_PROCESSING_DELAY_MS)
            );
          }
        } catch (batchError) {
          const errorMsg = `Error processing batch starting at ${start}: ${batchError}`;
          console.error(errorMsg);
          errors.push(errorMsg);

          // If it's an API rate limit error, wait longer before continuing
          const errorMessage =
            batchError instanceof Error
              ? batchError.message
              : String(batchError);
          const errorStatus = (batchError as any)?.status;

          if (errorMessage.includes("rate limit") || errorStatus === 429) {
            const rateLimitDelay = 5000; // 5 seconds for rate limit
            console.log(
              `🚫 Rate limit detected, waiting ${rateLimitDelay}ms before continuing`
            );
            await new Promise((resolve) => setTimeout(resolve, rateLimitDelay));
          } else {
            hasMore = false; // Stop on other errors
          }
        }
      }

      console.log(
        `✅ Completed bulk fetch and store. Fetched: ${totalFetched}, Stored: ${totalStored}, Errors: ${errors.length}`
      );

      return {
        totalFetched,
        totalStored,
        errors,
      };
    } catch (error) {
      console.error(
        "❌ Error in bulk fetch and store of player analyses:",
        error
      );
      throw new AppError("Failed to fetch and store all player analyses", 500);
    }
  }

  /**
   * Get stored player analyses for a specific league
   */
  async getStoredPlayerAnalyses(
    leagueKey: string,
    filters?: {
      position?: string;
      team?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<any[]> {
    try {
      logger.log(
        `📊 Retrieving stored player analyses for league: ${leagueKey}`
      );

      const query: any = { fantasyLeagueId: leagueKey };

      if (filters?.position) {
        query.displayPosition = filters.position;
      }

      if (filters?.team) {
        query.editorialTeamAbbr = filters.team;
      }

      const limit = filters?.limit || 100;
      const skip = filters?.skip || 0;

      const analyses = await PlayerAnalysis.find(query)
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(limit);

      logger.log(
        `✅ Retrieved ${analyses.length} player analyses for league: ${leagueKey}`
      );

      return analyses;
    } catch (error) {
      logger.error("❌ Error retrieving stored player analyses:", error);
      throw new AppError("Failed to retrieve stored player analyses", 500);
    }
  }

  /**
   * Get count of stored player analyses for a league
   */
  // async getPlayerAnalysesCount(leagueKey: string): Promise<number> {
  //   try {
  //     const count = await PlayerAnalysis.countDocuments({ fantasyLeagueId: leagueKey });
  //     return count;
  //   } catch (error) {
  //     logger.error("❌ Error counting player analyses:", error);
  //     throw new AppError("Failed to count player analyses", 500);
  //   }
  // }

  /**
   * Get draft results for the league (includes actual auction prices)
   * This is post-draft data showing what players actually sold for
   */
  async getLeagueDraftResults(
    userId: string,
    leagueKey: string
  ): Promise<any[]> {
    try {
      logger.log(`💰 Fetching draft results for league: ${leagueKey}`);

      const draftResults = await yahooApiService.getLeagueDraftResults(
        userId,
        leagueKey
      );

      return draftResults;
    } catch (error) {
      logger.error("❌ Error fetching draft results:", error);
      throw error;
    }
  }

  /**
   * Get league settings including auction budget and draft settings
   */
  // async getLeagueSettings(
  //   userId: string,
  //   leagueKey: string
  // ): Promise<any> {
  //   try {
  //     logger.log(`⚙️ Fetching league settings for league: ${leagueKey}`);

  //     const settings = await yahooApiService.getLeagueSettings(userId, leagueKey);

  //     return this.transformLeagueSettings(settings);
  //   } catch (error) {
  //     logger.error("❌ Error fetching league settings:", error);
  //     throw error;
  //   }
  // }

  /**
   * Get league teams and their current auction budgets
   */
  // async getLeagueTeams(
  //   userId: string,
  //   leagueKey: string
  // ): Promise<any[]> {
  //   try {
  //     logger.log(`👥 Fetching league teams for league: ${leagueKey}`);

  //     const teams = await yahooApiService.getLeagueTeams(userId, leagueKey);

  //     return this.transformLeagueTeams(teams);
  //   } catch (error) {
  //     logger.error("❌ Error fetching league teams:", error);
  //     throw error;
  //   }
  // }
}

export const draftService = new DraftService();
export default draftService;
