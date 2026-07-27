import { Router } from "express";
import aiController from "../controllers/ai.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import validate from "../../../middleware/validate";
import {
  generateResourceSchema,
  conceptParamsSchema,
} from "../validators/ai.validator";

const aiRoutes = Router({ mergeParams: true });

aiRoutes.use(authMiddleware);

aiRoutes.post(
  "/concepts/:conceptId/generate-resource",
  validate(conceptParamsSchema, "params"),
  validate(generateResourceSchema),
  aiController.generateResource,
);

export default aiRoutes;