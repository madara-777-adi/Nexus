import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import {
  heavyAiLimiter,
  fastAiLimiter,
} from "../../../middleware/rateLimiter.middleware";
import {
  validateAIRequest,
  tier1ModulesSchema,
  tier2SubtopicsSchema,
  tier3LessonSchema,
  evaluatorSchema,
  plannerSchema,
  resourceGeneratorSchema,
  quizGeneratorSchema,
} from "../validators/ai.validator";

const router = Router();

// Protect ALL AI routes with authentication middleware (Audit 1.1 & 1.2)
router.use(authMiddleware);

// --- 3-TIER JIT TEACHER OPERATIONS ---

// Tier 1: Generate 1st Pillar Workspace Modules
router.post(
  "/teacher/tier1-modules",
  heavyAiLimiter,
  validateAIRequest(tier1ModulesSchema),
  AIController.generateTier1Modules,
);

// Tier 2: Generate 2nd Pillar Subtopics for a specific concept
router.post(
  "/teacher/tier2-subtopics",
  heavyAiLimiter,
  validateAIRequest(tier2SubtopicsSchema),
  AIController.generateTier2Subtopics,
);

// Tier 3: Generate 3rd Level Deep Markdown Lesson, Flashcards & Quiz
router.post(
  "/teacher/tier3-lesson",
  heavyAiLimiter,
  validateAIRequest(tier3LessonSchema),
  AIController.generateTier3Lesson,
);

// --- EVALUATION & PLANNING OPERATIONS ---

router.post(
  "/evaluator/evaluate",
  heavyAiLimiter,
  validateAIRequest(evaluatorSchema),
  AIController.evaluateSubmission,
);

router.post(
  "/planner/plan",
  fastAiLimiter,
  validateAIRequest(plannerSchema),
  AIController.planPath,
);

// --- GENERATOR OPERATIONS ---

router.post(
  "/generator/resources",
  fastAiLimiter,
  validateAIRequest(resourceGeneratorSchema),
  AIController.generateResources,
);

router.post(
  "/generator/quiz",
  fastAiLimiter,
  validateAIRequest(quizGeneratorSchema),
  AIController.generateQuiz,
);

export default router;
