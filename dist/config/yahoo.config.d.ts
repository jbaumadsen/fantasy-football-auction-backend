declare const YAHOO_CLIENT_ID: string | undefined, YAHOO_CLIENT_SECRET: string | undefined, REDIRECT_URI: string | undefined, CLERK_SECRET_KEY: string | undefined;
declare const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
declare const YAHOO_TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
declare const YAHOO_API_URL = "https://fantasysports.yahooapis.com/fantasy/v2";
declare const YAHOO_SCOPE = "fspt-w";
declare const YAHOO_RESPONSE_TYPE = "code";
declare const YAHOO_GRANT_TYPE = "authorization_code";
declare const YAHOO_GRANT_TYPE_REFRESH = "refresh_token";
declare const YAHOO_API_FORMAT = "json";
declare const YAHOO_DEFAULT_PLAYER_COUNT = 25;
declare const YAHOO_DEFAULT_START_INDEX = 0;
declare const STATE_EXPIRY_MS: number;
declare const TOKEN_REFRESH_BUFFER_MS: number;
declare const YAHOO_CONTENT_TYPE = "application/x-www-form-urlencoded";
export { YAHOO_AUTH_URL, YAHOO_TOKEN_URL, YAHOO_API_URL, YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, REDIRECT_URI, CLERK_SECRET_KEY, YAHOO_SCOPE, YAHOO_RESPONSE_TYPE, YAHOO_GRANT_TYPE, YAHOO_GRANT_TYPE_REFRESH, YAHOO_API_FORMAT, YAHOO_DEFAULT_PLAYER_COUNT, YAHOO_DEFAULT_START_INDEX, STATE_EXPIRY_MS, TOKEN_REFRESH_BUFFER_MS, YAHOO_CONTENT_TYPE };
//# sourceMappingURL=yahoo.config.d.ts.map