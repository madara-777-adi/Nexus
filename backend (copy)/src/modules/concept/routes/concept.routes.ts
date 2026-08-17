import { Router } from "express";
import conceptController from "../controllers/concept.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import { standardApiLimiter } from "../../../middleware/rateLimiter.middleware";
import validate from "../../../middleware/validate";
import {
  createConceptSchema,
  updateConceptSchema,
  workspaceConceptParamsSchema,
} from "../validators/concept.validator";

const conceptRoutes = Router({ mergeParams: true });

conceptRoutes.use(authMiddleware);
conceptRoutes.use(standardApiLimiter);

// Workspace-scoped concepts
conceptRoutes.post(
  "/workspaces/:workspaceId/concepts",
  validate(workspaceConceptParamsSchema, "params"),
  validate(createConceptSchema),
  conceptController.create,
);

conceptRoutes.get(
  "/workspaces/:workspaceId/concepts",
  validate(workspaceConceptParamsSchema, "params"),
  conceptController.getAllInWorkspace,
);

// Individual concept actions
conceptRoutes.get("/concepts/:conceptId", conceptController.getOne);

conceptRoutes.patch(
  "/concepts/:conceptId",
  validate(updateConceptSchema),
  conceptController.update,
);

conceptRoutes.delete("/concepts/:conceptId", conceptController.delete);

export default conceptRoutes;
