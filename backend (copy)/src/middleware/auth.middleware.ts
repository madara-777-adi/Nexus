import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import env from "../config/env";
import User from "../modules/identity/models/user.model";
import { UnauthorizedError } from "../shared/errors/UnauthorizedError";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new UnauthorizedError("Authentication required");
    }

    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Invalid authentication header");
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch (_error) {
      throw new UnauthorizedError("Invalid or expired access token.");
    }

    if (!payload.sub) {
      throw new UnauthorizedError("Invalid access token.");
    }

    const user = await User.findOne({ userId: payload.sub });
    if (!user) {
      throw new UnauthorizedError("User not found.");
    }

    // Attach full Mongoose user document containing _id
    (req as any).user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;