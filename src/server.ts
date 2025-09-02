import "dotenv/config";
import app from "./app.js";
import mongoose from "mongoose";

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

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed.');
  });
  
  // Close database connection
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
  } catch (error) {
    console.log('⚠️ Error closing MongoDB connection:', error);
  }
  
  // Exit gracefully
  process.exit(0);
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err: Error) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  console.log(`Uncaught Exception: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});