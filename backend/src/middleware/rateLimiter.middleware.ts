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

export const heavyAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Generative AI (GEMINI)"),
});

export const fastAiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler("Interactive AI (Groq)"),
});