import yahooApiService from "./yahooApi.service.js";

export const getAllLeaguesForUserService = async (userId: string) => {
  // get all leagues for a user from the yahoo api
  console.log("userId in getAllLeaguesForUserService line 5", userId);
  
  try {
    const response = await yahooApiService.getUserLeagues(userId);
    
    // Transform the Yahoo API response to match our expected format
    const transformedLeagues = transformYahooLeaguesResponse(response);
    
    return {
      success: true,
      data: transformedLeagues,
      count: transformedLeagues.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching leagues:", error);
    throw error;
  }
}

// Transform Yahoo API response to our League interface
function transformYahooLeaguesResponse(yahooResponse: any): any[] {
  if (!yahooResponse?.fantasy_content?.users?.[0]?.user?.[1]?.games) {
    return [];
  }

  const games = yahooResponse.fantasy_content.users[0].user[1].games;
  const leagues = [];

  // Yahoo returns games as an object with numeric keys
  for (const gameKey in games) {
    if (gameKey === 'count') continue; // Skip the count field
    
    const game = games[gameKey];
    if (game && game.game) {
      const gameData = game.game[0];
      const gameLeagues = game.game[1]?.leagues || {};
      
      // Process each league in this game
      for (const leagueKey in gameLeagues) {
        if (leagueKey === 'count') continue;
        
        const league = gameLeagues[leagueKey];
        if (league && league.league) {
          const leagueData = league.league[0];
          const leagueSettings = league.league[1]?.settings || {};
          
          leagues.push({
            league_key: leagueData.league_key,
            name: leagueData.name,
            league_type: gameData.code, // e.g., 'nfl', 'mlb'
            season: leagueData.season,
            num_teams: leagueData.num_teams,
            draft_type: leagueSettings.draft_type || 'snake',
            scoring_type: leagueSettings.scoring_type || 'head',
            is_auction: leagueSettings.draft_type === 'auction',
            auction_budget: leagueSettings.auction_budget
          });
        }
      }
    }
  }

  return leagues;
}