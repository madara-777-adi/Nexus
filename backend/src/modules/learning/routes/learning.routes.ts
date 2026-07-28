import { Router } from "express";
import learningController from "../controllers/learning.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import validate from "../../../middleware/validate";
import {
  recordProgressSchema,
  workspaceProgressParamsSchema,
} from "../validators/learning.validator";

const learningRoutes = Router({ mergeParams: true });

learningRoutes.use(authMiddleware);

// Initialize graph progression state for a workspace
learningRoutes.post(
  "/workspaces/:workspaceId/learning/init",
  validate(workspaceProgressParamsSchema, "params"),
  learningController.initializeProgress,
);

// Fetch progression dashboard data for a workspace
learningRoutes.get(
  "/workspaces/:workspaceId/learning",
  validate(workspaceProgressParamsSchema, "params"),
  learningController.getWorkspaceProgress,
);

// Record mastery evaluation from AI and trigger unlock cascades
learningRoutes.post(
  "/learning/record",
  validate(recordProgressSchema),
  learningController.recordEvaluation,
);

export default learningRoutes;