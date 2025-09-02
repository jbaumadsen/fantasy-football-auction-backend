

// get all leagues for a user
import { Router } from "express";
import { getAllLeaguesForUserController } from "../controllers/leagues.controller";
import { appAuthMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", appAuthMiddleware(["user"]), getAllLeaguesForUserController);

export default router;