import { AuthenticatedRequest } from "../types/authenticatedRequest.types";
import { Response, NextFunction } from "express";
import { getAllLeaguesForUserService } from "../services/league.service.js";


export const getAllLeaguesForUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;

    console.log("userId in getAllLeaguesForUserController line 9", userId);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const leagues = await getAllLeaguesForUserService(userId);
        res.json(leagues);
    } catch (error) {
        next(error);
    }
}