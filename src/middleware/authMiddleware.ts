// src/middleware/gatherMoreAuth.ts

// Consider adding:
// Better type safety - The as any casts could be improved:
// Transaction handling - User creation/updates could benefit from MongoDB transactions for data consistency
// Caching - Consider caching user lookups to avoid DB queries on every request
// Validation - Could add validation for the allowedRoles parameter
// Logging - The commented console.logs suggest you might want structured logging

import { Response, NextFunction } from "express";
import { clerkClient, requireAuth, getAuth } from "@clerk/express";
import { AuthenticatedRequest } from "../types/authenticatedRequest.types";
import User from "../models/user.model";
import { IUser } from "../types/user.types";
import { normalizeEmail } from "../utils/normalizeEmail.utils";

export const appAuthMiddleware = (allowedRoles: string[]) => async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Require the user to be authenticated
  requireAuth()(req, res, async () => {
    const clerkAuth = getAuth(req);

    // console.log("clerkAuth in auth middleware line 17");

    if (!clerkAuth.userId) {
      console.log("clerkAuth.userId is null");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const clerkUser = await clerkClient.users.getUser(clerkAuth.userId);
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        "";

      if (!email) {
        return res.status(401).json({ error: "Unauthorized no email address associated with account" });
      }

      const normalizedEmail = normalizeEmail(email);
      let dbUser: IUser | null = await User.findOne({ clerkUserId: clerkAuth.userId });

      if (!dbUser) {
        dbUser = await User.findOne({ email: normalizedEmail });

        if (dbUser) {
          // console.log("updating existing user in auth middleware line 42");
          dbUser.clerkUserId = clerkAuth.userId;
          await dbUser.save();
        } else {
          // console.log("creating new user in auth middleware line 45");
          dbUser = await User.create({
            clerkUserId: clerkAuth.userId,
            username: clerkUser.username || clerkUser.firstName || "",
            email,
            displayName: clerkUser.username || clerkUser.firstName || "",
            roles: ["user"],
            password: null, // set a dummy password, or leave null and remove required if you're using Clerk only
          });
        }
      } 

      if (!dbUser) {
        return res.status(401).json({ error: "Unauthorized no user found" });
      }

      // TODO: check dbUser username, displayName, and email match clerkUser username and email if they don't match, update dbUser and their associated db objects


      req.auth = clerkAuth as any;
      req.userEmail = normalizedEmail;
      req.userClerkId = clerkAuth.userId;
      req.clerkUser = clerkUser as any;
      req.dbUser = dbUser;
      req.userId = dbUser._id.toString();

      if (allowedRoles?.length > 0) {
        const userRoles = dbUser.roles || [];
        const hasRole = userRoles.some((r) => allowedRoles.includes(r));
        if (!hasRole) {
          return res.status(403).json({ error: "Forbidden: insufficient role" });
        }
      }

      next();
    } catch (err) {
      console.error("Unauthorized", err);
      res.status(401).json({ error: "Unauthorized" });
    }
  });
};
