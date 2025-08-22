import "dotenv/config";
import app from "./app.js";
// Log environment variables (without secrets)
console.log("🔧 Environment check:");
console.log("  PORT:", process.env.PORT || 4000);
console.log("  CORS_ORIGINS:", process.env.CORS_ORIGINS);
console.log("  MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing");
console.log("  YAHOO_CLIENT_ID:", process.env.YAHOO_CLIENT_ID ? "✅ Set" : "❌ Missing");
console.log("  YAHOO_CLIENT_SECRET:", process.env.YAHOO_CLIENT_SECRET ? "✅ Set" : "❌ Missing");
console.log("  REDIRECT_URI:", process.env.REDIRECT_URI);
console.log("  CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "✅ Set" : "❌ Missing");
console.log("  CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing");
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
process.on('unhandledRejection', (err) => {
    console.log(`Unhandled Rejection: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
//# sourceMappingURL=server.js.map