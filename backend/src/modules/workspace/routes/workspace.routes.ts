import { Router } from "express";
import workspaceController from "../controllers/workspace.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import { standardApiLimiter } from "../../../middleware/rateLimiter.middleware";
import validate from "../../../middleware/validate";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceParamSchema,
} from "../validators/workspace.validator";

const workspaceRoutes = Router();

// Protect all workspace endpoints with Auth Middleware and Rate Limiter
workspaceRoutes.use(authMiddleware);
workspaceRoutes.use(standardApiLimiter);

workspaceRoutes.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.create,
);

workspaceRoutes.get("/", workspaceController.getAll);

workspaceRoutes.get(
  "/:id",
  validate(workspaceParamSchema, "params"),
  workspaceController.getOne,
);

workspaceRoutes.patch(
  "/:id",
  validate(workspaceParamSchema, "params"),
  validate(updateWorkspaceSchema),
  workspaceController.update,
);

workspaceRoutes.delete(
  "/:id",
  validate(workspaceParamSchema, "params"),
  workspaceController.delete,
);

export default workspaceRoutes;
