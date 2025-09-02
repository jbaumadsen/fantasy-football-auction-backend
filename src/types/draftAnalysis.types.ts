export interface YahooDraftAnalysis {
  average_pick: string;
  average_round: string;
  average_cost: string;
  percent_drafted: string;
  preseason_average_pick: string;
  preseason_average_round: string;
  preseason_average_cost: string;
  preseason_percent_drafted: string;
}

export interface YahooPlayerData {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
    ascii_first: string;
    ascii_last: string;
  };
  display_position: string;
  editorial_team_abbr: string;
  editorial_team_full_name: string;
  editorial_team_key: string;
  editorial_player_key: string;
  status?: string;
  status_full?: string;
  injury_note?: string;
  bye_weeks?: {
    week: string;
  };
  uniform_number?: string;
  headshot?: {
    url: string;
    size: string;
  };
  image_url?: string;
  has_player_notes?: number;
  player_notes_last_timestamp?: number;
}

export interface YahooPlayerWithDraftAnalysis {
  player: [YahooPlayerData[], YahooDraftAnalysis];
}

export interface YahooLeaguePlayersResponse {
  fantasy_content: {
    league: [
      {
        league_key: string;
        league_id: string;
        name: string;
        // ... other league fields
      },
      {
        players: {
          [key: string]: YahooPlayerWithDraftAnalysis | string;
        };
      }
    ];
  };
}

export interface PlayerAnalysisInput {
  fantasyLeagueId: string;
  yahooPlayerKey: string;
  playerName: string;
  averagePick: string;
  averageRound: string;
  averageCost: string;
  percentDrafted: string;
  preseasonAveragePick: string;
  preseasonAverageRound: string;
  preseasonAverageCost: string;
  preseasonPercentDrafted: string;
}
