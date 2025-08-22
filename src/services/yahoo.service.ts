import crypto from "crypto";
import axios from "axios";
import qs from "qs";
import UserToken from "../models/UserToken.js";
import {
  YAHOO_CLIENT_ID,
  YAHOO_CLIENT_SECRET,
  REDIRECT_URI,
  CLERK_SECRET_KEY,
  YAHOO_TOKEN_URL,
  YAHOO_API_URL,
  YAHOO_GRANT_TYPE,
  YAHOO_GRANT_TYPE_REFRESH,
  YAHOO_API_FORMAT,
} from "../config/yahoo.config.js";
import { AppError } from "../types/error.types.js";

export class YahooService {
  /**
   * Generate Basic Auth header for Yahoo OAuth
   */
  private generateBasicAuth(): string {
    return "Basic " + Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString("base64");
  }

  /**
   * Sign OAuth state for security
   */
  signState(payload: any): string {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto
      .createHmac("sha256", CLERK_SECRET_KEY!)
      .update(data)
      .digest("base64url");
    return `${data}.${sig}`;
  }

  /**
   * Verify OAuth state signature
   */
  verifyState(state: string): any | null {
    const [data, sig] = String(state).split(".");
    const expected = crypto
      .createHmac("sha256", CLERK_SECRET_KEY!)
      .update(data)
      .digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await axios.post(
      YAHOO_TOKEN_URL,
      qs.stringify({
        grant_type: YAHOO_GRANT_TYPE,
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.generateBasicAuth(),
        },
      }
    );
    return response.data;
  }

  /**
   * Refresh access token if needed
   */
  async refreshAccessToken(refreshToken: string): Promise<any> {
    const response = await axios.post(
      YAHOO_TOKEN_URL,
      qs.stringify({
        grant_type: YAHOO_GRANT_TYPE_REFRESH,
        refresh_token: refreshToken,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: this.generateBasicAuth(),
        },
      }
    );
    return response.data;
  }

  /**
   * Get or refresh access token for a user
   */
  async getOrRefreshAccessToken(userId: string): Promise<string> {
    const userToken = await UserToken.findOne({ localUserId: userId });
    if (!userToken || !userToken.refresh_token) {
      throw new AppError("No Yahoo tokens found for user", 404);
    }

    // Check if token needs refresh (with 1 minute buffer)
    if (Date.now() > (userToken.expires_at as Date).getTime() - 60_000) {
      const refreshResponse = await this.refreshAccessToken(userToken.refresh_token as string);
      
      // Update tokens in database
      userToken.access_token = refreshResponse.access_token as string;
      userToken.expires_at = new Date(Date.now() + (refreshResponse.expires_in as number) * 1000);
      if (refreshResponse.refresh_token) {
        userToken.refresh_token = refreshResponse.refresh_token as string;
      }
      await userToken.save();
    }

    return userToken.access_token as string;
  }

  /**
   * Save user tokens to database
   */
  async saveUserTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    await UserToken.findOneAndUpdate(
      { localUserId: userId },
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Make authenticated request to Yahoo API
   */
  async makeYahooApiRequest(userId: string, endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const accessToken = await this.getOrRefreshAccessToken(userId);
    
    const url = `${YAHOO_API_URL}${endpoint}?format=${YAHOO_API_FORMAT}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    
    return response.data;
  }

  /**
   * Get players from Yahoo Fantasy API
   */
  async getPlayers(userId: string, leagueKey: string, search?: string, start: number = 0, count: number = 25): Promise<any> {
    let endpoint = `/league/${leagueKey}/players;start=${start};count=${count}`;
    if (search) {
      endpoint += `;search=${encodeURIComponent(search)}`;
    }
    
    return this.makeYahooApiRequest(userId, endpoint);
  }

  /**
   * Get user's Yahoo games
   */
  async getUserGames(userId: string): Promise<any> {
    console.log("🔍 Getting user games for user:", userId);
    return this.makeYahooApiRequest(userId, "/users;use_login=1/games");
  }

  /**
   * Get league settings
   */
  async getLeagueSettings(userId: string, leagueKey: string): Promise<any> {
    return this.makeYahooApiRequest(userId, `/league/${leagueKey}/settings`);
  }

  /**
   * Get league draft results
   */
  async getLeagueDraftResults(userId: string, leagueKey: string): Promise<any> {
    return this.makeYahooApiRequest(userId, `/league/${leagueKey}/draftresults`);
  }

  /**
   * Get league teams
   */
  async getLeagueTeams(userId: string, leagueKey: string): Promise<any> {
    return this.makeYahooApiRequest(userId, `/league/${leagueKey}/teams`);
  }

  /**
   * Get team roster
   */
  async getTeamRoster(userId: string, teamKey: string): Promise<any> {
    return this.makeYahooApiRequest(userId, `/team/${teamKey}/roster`);
  }
}

// Export singleton instance
export const yahooService = new YahooService();
export default yahooService;
