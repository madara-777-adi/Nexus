import { Router } from "express";
import relationshipController from "../controllers/relationship.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import validate from "../../../middleware/validate";
import {
  createRelationshipSchema,
  workspaceParamsSchema,
} from "../validators/relationship.validator";

const relationshipRoutes = Router({ mergeParams: true });

relationshipRoutes.use(authMiddleware);

// Create edge & Stream full graph
relationshipRoutes.post(
  "/workspaces/:workspaceId/relationships",
  validate(workspaceParamsSchema, "params"),
  validate(createRelationshipSchema),
  relationshipController.create,
);

relationshipRoutes.get(
  "/workspaces/:workspaceId/relationships/stream",
  validate(workspaceParamsSchema, "params"),
  relationshipController.streamGraph,
);

// Concept graph neighborhood
relationshipRoutes.get(
  "/concepts/:conceptId/relationships",
  relationshipController.getNeighborhood,
);

// Delete edge
relationshipRoutes.delete(
  "/relationships/:relationshipId",
  relationshipController.delete,
);

export default relationshipRoutes;