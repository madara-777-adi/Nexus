import { Router } from "express";
import workspaceController from "../controllers/workspace.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import {
  standardApiLimiter,
  heavyAiLimiter,
} from "../../../middleware/rateLimiter.middleware";
import validate from "../../../middleware/validate";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceParamSchema,
} from "../validators/workspace.validator";

const workspaceRoutes = Router();

// Protect all workspace endpoints with Auth Middleware
workspaceRoutes.use(authMiddleware);

// AI Blueprint Generation (Heavy AI rate limit: 10 req / 15 min / IP)
workspaceRoutes.post(
  "/",
  heavyAiLimiter,
  validate(createWorkspaceSchema),
  workspaceController.create,
);

// Standard Workspace CRUD routes (Standard rate limit: 100 req / 15 min / IP)
workspaceRoutes.get("/", standardApiLimiter, workspaceController.getAll);

workspaceRoutes.get(
  "/:id",
  standardApiLimiter,
  validate(workspaceParamSchema, "params"),
  workspaceController.getOne,
);

workspaceRoutes.patch(
  "/:id",
  standardApiLimiter,
  validate(workspaceParamSchema, "params"),
  validate(updateWorkspaceSchema),
  workspaceController.update,
);

workspaceRoutes.delete(
  "/:id",
  standardApiLimiter,
  validate(workspaceParamSchema, "params"),
  workspaceController.delete,
);

export default workspaceRoutes;
