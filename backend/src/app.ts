import express from "express";

import authRoutes from "./modules/identity/routes/auth.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use(errorMiddleware)

export default app;
