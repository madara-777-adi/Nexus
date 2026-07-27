import { Router } from "express";
import resourceController from "../controllers/resource.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import validate from "../../../middleware/validate";
import {
  createResourceSchema,
  updateResourceSchema,
  conceptResourceParamsSchema,
} from "../validators/resource.validator";

const resourceRoutes = Router({ mergeParams: true });

resourceRoutes.use(authMiddleware);

// Attach and list structured text resources scoped to a concept
resourceRoutes.post(
  "/concepts/:conceptId/resources",
  validate(conceptResourceParamsSchema, "params"),
  validate(createResourceSchema),
  resourceController.create,
);

resourceRoutes.get(
  "/concepts/:conceptId/resources",
  validate(conceptResourceParamsSchema, "params"),
  resourceController.getAllForConcept,
);

// Individual resource endpoints
resourceRoutes.get(
  "/resources/:resourceId",
  resourceController.getOne,
);

resourceRoutes.patch(
  "/resources/:resourceId",
  validate(updateResourceSchema),
  resourceController.update,
);

resourceRoutes.delete(
  "/resources/:resourceId",
  resourceController.delete,
);

export default resourceRoutes;