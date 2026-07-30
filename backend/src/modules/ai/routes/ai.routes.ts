import { Router } from "express";
import { AIController } from "../controllers/ai.controller";

const router = Router();

// --- 3-TIER JIT TEACHER OPERATIONS ---

// Tier 1: Generate 1st Pillar Workspace Modules
router.post("/teacher/tier1-modules", AIController.generateTier1Modules);

// Tier 2: Generate 2nd Pillar Subtopics for a specific concept
router.post("/teacher/tier2-subtopics", AIController.generateTier2Subtopics);

// Tier 3: Generate 3rd Level Deep Markdown Lesson, Flashcards & Quiz
router.post("/teacher/tier3-lesson", AIController.generateTier3Lesson);

// --- EVALUATION & PLANNING OPERATIONS ---

router.post("/evaluator/evaluate", AIController.evaluateSubmission);
router.post("/planner/plan", AIController.planPath);

// --- GENERATOR OPERATIONS ---

router.post("/generator/resources", AIController.generateResources);
router.post("/generator/quiz", AIController.generateQuiz);

export default router;
