/**
 * Utility functions for transforming Yahoo Fantasy API responses
 */

/**
 * Extract the first value for a given key from Yahoo's "array-of-objects" node
 */
export function firstVal(arr: any[], key: string) {
  if (!Array.isArray(arr)) return undefined;
  for (const item of arr) {
    if (item && Object.prototype.hasProperty.call(item, key)) {
      return item[key];
    }
  }
  return undefined;
}

/**
 * Extract draft picks from Yahoo draft results response
 */
export function extractPicks(draftJson: any, leagueKey?: string) {
  const dr = draftJson?.fantasy_content?.league?.[1]?.draft_results;
  if (!dr || typeof dr !== 'object') return [];

  // gameKey helps if Yahoo returns player_id but not player_key
  const gameKey = (leagueKey || "").split(".l.")[0]; // e.g. "nfl" or "388"

  const out: Array<{ player_key: string; team_key: string; cost?: number }> = [];
  
  // Yahoo uses numbered keys: { "0": { draft_result: {...} }, "1": { draft_result: {...} } }
  for (const key of Object.keys(dr)) {
    if (key === 'count') continue; // Skip count property
    
    const entry = dr[key];
    if (!entry?.draft_result) continue;
    
    const r = entry.draft_result;
    const player_key = r.player_key;
    const team_key = r.team_key;
    const cost = r.cost ? Number(r.cost) : undefined;
    
    if (player_key && team_key) {
      out.push({ player_key, team_key, cost });
    }
  }
  return out;
}

/**
 * Extract teams from Yahoo teams response
 */
export function extractTeams(teamsJson: any) {
  const teamsNode = teamsJson?.fantasy_content?.league?.[1]?.teams;
  if (!teamsNode || typeof teamsNode !== 'object') return [];

  const out: Array<{ team_key: string; name?: string }> = [];
  
  // Yahoo stores teams as numbered keys: { '0': { team: [...] }, '1': { team: [...] }, count: 10 }
  for (const key of Object.keys(teamsNode)) {
    // Skip the 'count' property
    if (key === 'count') continue;
    
    const entry = teamsNode[key];
    if (!entry?.team) continue;

    // Each team is wrapped in an extra array: team: [ [ {...}, {...}, {...} ] ]
    const teamData = entry.team[0]; // Get the first (and only) array element
    if (!teamData || !Array.isArray(teamData)) continue;

    // Find team_key and name in the array of objects
    let team_key = "";
    let name = "";
    
    for (const item of teamData) {
      if (item.team_key) team_key = item.team_key;
      if (item.name) name = item.name;
    }

    if (team_key) out.push({ team_key, name });
  }
  return out;
}

/**
 * Extract draft budget from Yahoo league settings response
 */
export function extractBudget(settingsJson: any): number {
  // Draft budget can live under different paths depending on sport/season.
  // Try a couple of common ones, fall back to 200.
  const leagueNode = settingsJson?.fantasy_content?.league?.[1];
  return Number(
    leagueNode?.settings?.[0]?.league?.[0]?.draft_budget ??
      leagueNode?.settings?.[0]?.draft_budget ??
      200
  );
}

/**
 * Compute remaining budgets for teams based on picks and league budget
 */
export function computeBudgets(teams: any[], picks: any[], leagueBudget: number) {
  const spent = new Map<string, number>();
  for (const p of picks) {
    const cost = Number(p.cost || 0);
    if (cost > 0) spent.set(p.team_key, (spent.get(p.team_key) || 0) + cost);
  }
  return teams.map(t => {
    const used = spent.get(t.team_key) || 0;
    const remaining = Math.max(leagueBudget - used, 0);
    return { 
      team_key: t.team_key, 
      team_name: t.name, 
      spent: used, 
      remaining, 
      maxBid: Math.max(remaining - 1, remaining) 
    };
  }).sort((a,b) => b.remaining - a.remaining);
}
