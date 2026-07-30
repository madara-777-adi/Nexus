import "dotenv/config"; // MUST BE LINE 1!
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import resourceRoutes from "./modules/resource/routes/resource.routes";
import relationshipRoutes from "./modules/relationship/routes/relationship.routes";
import conceptRoutes from "./modules/concept/routes/concept.routes";
import workspaceRoutes from "./modules/workspace/routes/workspace.routes";
import env from "./config/env";
import passport from "./config/passport";
import authRoutes from "./modules/identity/routes/auth.routes";
import notFoundMiddleware from "./middleware/not-found.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import aiRoutes from "./modules/ai/routes/ai.routes";
import learningRoutes from "./modules/learning/routes/learning.routes";

// Import rate limiter middleware
import { authLimiter } from "./middleware/rateLimiter.middleware";

const app = express();

app.set("trust proxy", 1);

// Audit 7.1 Fix: Apply baseline HTTP security headers middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Combine development origins, both production domain variants (apex & www), and env.FRONTEND_URL
const rawOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://nexusspace.tech",
  "https://www.nexusspace.tech",
  env.FRONTEND_URL,
];

// Clean up trailing slashes and remove falsy/duplicate values
const allowedOrigins = Array.from(
  new Set(
    rawOrigins
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => (origin.endsWith("/") ? origin.slice(0, -1) : origin)),
  ),
);

// Define comprehensive CORS options including preflight allowed methods & headers
const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  credentials: true, // Enables sending/receiving HttpOnly cookies across origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

// Apply CORS middleware (Automatically handles OPTIONS preflight for all routes)
app.use(cors(corsOptions));

// Parse incoming cookies from request headers into req.cookies
app.use(cookieParser());

// Audit 7.2 Fix: Explicitly configure request body payload limit
app.use(express.json({ limit: "10mb" }));

// Root & Health Check Endpoints (Fixes Render deployment 404 health check errors)
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "NexusSpace API Engine is active.",
    timestamp: new Date().toISOString(),
  });
});

app.head("/", (_req, res) => {
  res.status(200).end();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

// Initialize Passport middleware for Google and GitHub OAuth
app.use(passport.initialize());

// Mount identity authentication routes WITH the rate limiter applied
app.use("/api/v1/auth", authLimiter, authRoutes);

app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1", conceptRoutes);
app.use("/api/v1", relationshipRoutes);
app.use("/api/v1", resourceRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1", learningRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
