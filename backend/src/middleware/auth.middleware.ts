import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import env from "../config/env";
import User from "../modules/identity/models/user.model";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      success: false,
      message: "Invalid authentication header",
    });
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (!payload.sub) {
      res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
      return;
    }
    const user = await User.findOne({ userId: payload.sub });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found.",
      });
      return;
    }
    (req as Request & { user: typeof user }).user = user;

    next();
  } catch (_error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token.",
    });
  }
};
export default authMiddleware;
