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

const app = express();

app.set("trust proxy", 1);

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

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Enables sending/receiving HttpOnly cookies across origins
  }),
);

// Parse incoming cookies from request headers into req.cookies
app.use(cookieParser());

app.use(express.json());

// Initialize Passport middleware for Google and GitHub OAuth
app.use(passport.initialize());

// Mount identity authentication routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1", conceptRoutes);
app.use("/api/v1", relationshipRoutes);
app.use("/api/v1", resourceRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1", learningRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;