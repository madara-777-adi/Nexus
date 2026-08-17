import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

const createLimitHandler = (tierName: string) => {
  return (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      tier: tierName,
      message: `Too many requests for ${tierName} operations. Please wait before trying again.`,
    });
  };
};

/**
 * Heavy AI operations (e.g. workspace generation, curriculum planning)
 * 10 requests per 15 minutes window
 */
export const heavyAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Generative AI (Groq)"),
});

/**
 * Fast AI operations (e.g. streaming tutor responses, rapid chat)
 * 30 requests per 1 minute window
 */
export const fastAiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Interactive AI (Groq)"),
});

/**
 * Authentication endpoints (login, register, reset password, refresh token)
 * Prevents credential stuffing and brute-force attacks
 * 15 requests per 15 minutes window
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Authentication"),
});

/**
 * Session-check endpoints (GET/PATCH /me, refresh-token)
 * These are called automatically and frequently by the frontend
 * (session check on app load, token refresh on any 401) — needs a much
 * looser budget than credential-guessing endpoints to avoid locking out
 * legitimate users sharing an IP (NAT, campus/office networks).
 * 60 requests per 5 minutes window
 */
export const sessionCheckLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Session"),
});

/**
 * Standard REST API routes (workspaces, concepts, resources)
 * 100 requests per 15 minutes window
 */
export const standardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Standard API"),
});
