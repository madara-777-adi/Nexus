import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import {
  validateAIRequest,
  teacherStreamSchema as teacherLessonSchema,
  evaluatorSchema,
  plannerSchema,
  resourceGeneratorSchema,
  quizGeneratorSchema,
} from "../validators/ai.validator";

const router = Router();

// Core AI Operations
router.post(
  "/teacher/lesson",
  validateAIRequest(teacherLessonSchema),
  AIController.generateLesson
);

router.post(
  "/evaluator/evaluate",
  validateAIRequest(evaluatorSchema),
  AIController.evaluateSubmission
);

router.post(
  "/planner/plan",
  validateAIRequest(plannerSchema),
  AIController.planPath
);

// Content Generation Operations
router.post(
  "/generator/resources",
  validateAIRequest(resourceGeneratorSchema),
  AIController.generateResources
);

router.post(
  "/generator/quiz",
  validateAIRequest(quizGeneratorSchema),
  AIController.generateQuiz
);

export default router;