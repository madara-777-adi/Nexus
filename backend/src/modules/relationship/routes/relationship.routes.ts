import { Router } from "express";
import relationshipController from "../controllers/relationship.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import validate from "../../../middleware/validate";
import {
  createRelationshipSchema,
  workspaceParamsSchema,
  conceptParamsSchema,
  relationshipParamsSchema,
} from "../validators/relationship.validator";

const relationshipRoutes = Router({ mergeParams: true });

relationshipRoutes.use(authMiddleware);

// Create edge
relationshipRoutes.post(
  "/workspaces/:workspaceId/relationships",
  validate(workspaceParamsSchema, "params"),
  validate(createRelationshipSchema),
  relationshipController.create,
);

// Fetch structured REST JSON 2-level graph
relationshipRoutes.get(
  "/workspaces/:workspaceId/relationships/stream",
  validate(workspaceParamsSchema, "params"),
  relationshipController.getGraph,
);

// Concept graph neighborhood
relationshipRoutes.get(
  "/concepts/:conceptId/relationships",
  validate(conceptParamsSchema, "params"),
  relationshipController.getNeighborhood,
);

// Delete edge
relationshipRoutes.delete(
  "/relationships/:relationshipId",
  validate(relationshipParamsSchema, "params"),
  relationshipController.delete,
);

export default relationshipRoutes;