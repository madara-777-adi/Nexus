import express from "express";
import cors from "cors";

import env from "./config/env";
import authRoutes from "./modules/identity/routes/auth.routes";
import notFoundMiddleware from "./middleware/not-found.middleware";
import { errorMiddleware } from "./middleware/error.middleware";

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
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
