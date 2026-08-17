import { Router } from "express";
import resourceController from "../controllers/resource.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import { standardApiLimiter } from "../../../middleware/rateLimiter.middleware";
import validate from "../../../middleware/validate";
import {
  createResourceSchema,
  updateResourceSchema,
  conceptResourceParamsSchema,
  resourceParamsSchema,
} from "../validators/resource.validator";

const resourceRoutes = Router({ mergeParams: true });

resourceRoutes.use(authMiddleware);
resourceRoutes.use(standardApiLimiter);

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
  validate(resourceParamsSchema, "params"),
  resourceController.getOne,
);

resourceRoutes.patch(
  "/resources/:resourceId",
  validate(resourceParamsSchema, "params"),
  validate(updateResourceSchema),
  resourceController.update,
);

resourceRoutes.delete(
  "/resources/:resourceId",
  validate(resourceParamsSchema, "params"),
  resourceController.delete,
);

export default resourceRoutes;
