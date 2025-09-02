import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import corsOptions from "./config/cors.config.js";
import connectDB from "./config/db.config.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";
import authRoutes from "./routes/auth.routes.js";
import yahooApiRoutes from "./routes/yahooApi.routes.js";
import draftRoutes from "./routes/draft.routes.js";
import playerRoutes from "./routes/player.routes.js";
const { MONGODB_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, } = process.env;
const app = express();
// GlobalMiddleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(clerkMiddleware({
    publishableKey: CLERK_PUBLISHABLE_KEY,
    secretKey: CLERK_SECRET_KEY,
}));
// MongoDB connection
connectDB(MONGODB_URI);
app.use("/api/auth", authRoutes);
app.use("/api/draft", draftRoutes);
app.use("/api/yahoo", yahooApiRoutes);
app.use("/api/players", playerRoutes);
// Error handling
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map