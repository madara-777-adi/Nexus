import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import authMiddleware from "../../../middleware/auth.middleware";
import {
  heavyAiLimiter,
  fastAiLimiter,
} from "../../../middleware/rateLimiter.middleware"

const router = Router();

// Protect ALL AI routes with authentication middleware (Audit 1.1 & 1.2)
router.use(authMiddleware);

// --- 3-TIER JIT TEACHER OPERATIONS ---

// Tier 1: Generate 1st Pillar Workspace Modules
router.post(
  "/teacher/tier1-modules",
  heavyAiLimiter,
  AIController.generateTier1Modules,
);

// Tier 2: Generate 2nd Pillar Subtopics for a specific concept
router.post(
  "/teacher/tier2-subtopics",
  heavyAiLimiter,
  AIController.generateTier2Subtopics,
);

// Tier 3: Generate 3rd Level Deep Markdown Lesson, Flashcards & Quiz
router.post(
  "/teacher/tier3-lesson",
  heavyAiLimiter,
  AIController.generateTier3Lesson,
);

// --- EVALUATION & PLANNING OPERATIONS ---

router.post(
  "/evaluator/evaluate",
  heavyAiLimiter,
  AIController.evaluateSubmission,
);
router.post("/planner/plan", heavyAiLimiter, AIController.planPath);

// --- GENERATOR OPERATIONS ---

router.post(
  "/generator/resources",
  heavyAiLimiter,
  AIController.generateResources,
);
router.post("/generator/quiz", heavyAiLimiter, AIController.generateQuiz);

export default router;
