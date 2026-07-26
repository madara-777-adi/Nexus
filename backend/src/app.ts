import express from "express";
import cors from "cors";

import env from "./config/env";
import authRoutes from "./modules/identity/routes/auth.routes";
import notFoundMiddleware from "./middleware/not-found.middleware";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
