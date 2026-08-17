import "dotenv/config"; // MUST BE LINE 1![cite: 19]
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

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

// Rate limiter middleware is now applied per-route inside individual route files.

const app = express();

app.set("trust proxy", 1);

// Apply Helmet security headers (HSTS, CSP, COOP, Nosniff, Frameguard)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Dynamically extract allowed origins from environment variables
const configuredOrigins = (env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

// Hardcoded production fallbacks so CORS never fails even if env injection drops
const defaultProductionOrigins = [
  "https://nexusspace.tech",
  "https://www.nexusspace.tech",
];

const defaultDevOrigins =
  env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:3000",
      ];

// Combine config origins with production and development fallbacks, normalizing trailing slashes
const allowedOrigins = Array.from(
  new Set(
    [
      ...configuredOrigins,
      ...defaultProductionOrigins,
      ...defaultDevOrigins,
    ].map((origin) => (origin.endsWith("/") ? origin.slice(0, -1) : origin)),
  ),
);

// Define comprehensive CORS options including preflight allowed methods & headers
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests or non-browser tools (e.g. Postman, curl) with no origin header
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin violation: ${origin} not allowed.`));
  },
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

// Explicitly configure request body payload limit
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
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1", conceptRoutes);
app.use("/api/v1", relationshipRoutes);
app.use("/api/v1", resourceRoutes);
app.use("/api/v1", learningRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;