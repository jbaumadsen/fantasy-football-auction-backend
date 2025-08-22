const { YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, REDIRECT_URI, CLERK_SECRET_KEY, } = process.env;
const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const YAHOO_TOKEN_URL = `https://api.login.yahoo.com/oauth2/get_token`;
const YAHOO_API_URL = "https://fantasysports.yahooapis.com/fantasy/v2";
const YAHOO_SCOPE = "fspt-w";
const YAHOO_RESPONSE_TYPE = "code";
const YAHOO_GRANT_TYPE = "authorization_code";
const YAHOO_GRANT_TYPE_REFRESH = "refresh_token";
const YAHOO_API_FORMAT = "json";
const YAHOO_DEFAULT_PLAYER_COUNT = 25;
const YAHOO_DEFAULT_START_INDEX = 0;
const STATE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000; // 1 minute buffer
const YAHOO_CONTENT_TYPE = "application/x-www-form-urlencoded";
export { YAHOO_AUTH_URL, YAHOO_TOKEN_URL, YAHOO_API_URL, YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, REDIRECT_URI, CLERK_SECRET_KEY, YAHOO_SCOPE, YAHOO_RESPONSE_TYPE, YAHOO_GRANT_TYPE, YAHOO_GRANT_TYPE_REFRESH, YAHOO_API_FORMAT, YAHOO_DEFAULT_PLAYER_COUNT, YAHOO_DEFAULT_START_INDEX, STATE_EXPIRY_MS, TOKEN_REFRESH_BUFFER_MS, YAHOO_CONTENT_TYPE };
//# sourceMappingURL=yahoo.config.js.map