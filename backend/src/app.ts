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

const app = express();

// Combine local development origins and production FRONTEND_URL
const allowedOrigins = Array.from(
  new Set(
    ["http://localhost:5173", "http://localhost:3000", env.FRONTEND_URL].filter(
      Boolean,
    ),
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

app.use("/api/v1", aiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
