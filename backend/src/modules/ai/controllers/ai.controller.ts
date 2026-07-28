import { Request, Response, NextFunction } from "express";
import { GeminiProvider } from "../providers/gemini.provider";
import { TeacherService } from "../teacher/teacher.service";
import { EvaluatorService } from "../evaluator/evaluator.service";
import { PlannerService } from "../planner/planner.service";
import { ResourceGeneratorService } from "../generator/resource-generator.service";
import { QuizGeneratorService } from "../generator/quiz-generator.service";
import { SSEService } from "../stream/sse.service";
import { EvaluationResult } from "../types/ai.types";

// Instantiate Provider & Services
const geminiProvider = new GeminiProvider();
const teacherService = new TeacherService(geminiProvider);
const evaluatorService = new EvaluatorService(geminiProvider);
const plannerService = new PlannerService(geminiProvider);
const resourceGeneratorService = new ResourceGeneratorService(geminiProvider);
const quizGeneratorService = new QuizGeneratorService(geminiProvider);

export class AIController {
  // STREAM TEACHER LESSON (SSE)
  static async streamLesson(req: Request, res: Response, next: NextFunction) {
    try {
      SSEService.initStream(res);

      await teacherService.streamLesson(req.body, (chunk) => {
        SSEService.sendChunk(res, chunk);
      });

      SSEService.endStream(res);
    } catch (error) {
      next(error);
    }
  }

  // EVALUATE SUBMISSION & BACKEND DECISION ENGINE
  static async evaluateSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. AI reasoning step
      const evaluation = (await evaluatorService.evaluateSubmission(
        req.body
      )) as EvaluationResult;

      // 2. DETERMINISTIC BACKEND DECISION LAYER
      // AI only calculates mastery; BACKEND decides whether to unlock nodes or update DB state
      const PASSING_THRESHOLD = 80;
      const isPassed = evaluation.mastery >= PASSING_THRESHOLD;

      if (isPassed) {
        // e.g., await WorkspaceService.unlockNextNode(req.body.workspaceId, req.body.conceptId);
        // e.g., await ProgressService.updateMastery(req.user.id, evaluation.mastery);
      }

      // 3. Return response to frontend
      res.status(200).json({
        success: true,
        data: {
          evaluation,
          unlocked: isPassed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PLAN NEXT CONCEPT
  static async planPath(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await plannerService.planNextStep(req.body);
      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  // GENERATE EXTERNAL RESOURCES
  static async generateResources(req: Request, res: Response, next: NextFunction) {
    try {
      const resources = await resourceGeneratorService.generateResources(req.body);
      res.status(200).json({
        success: true,
        data: resources,
      });
    } catch (error) {
      next(error);
    }
  }

  // GENERATE STANDALONE QUIZ
  static async generateQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const quiz = await quizGeneratorService.generateQuiz(req.body);
      res.status(200).json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      next(error);
    }
  }
}