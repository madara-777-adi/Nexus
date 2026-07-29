import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { teacherService } from "../teacher/teacher.service";
import { evaluatorService } from "../evaluator/evaluator.service";
import { plannerService } from "../planner/planner.service";
import { quizGeneratorService } from "../generator/quiz-generator.service";
import { ResourceGeneratorService } from "../generator/resource-generator.service";

// --- IMPORTING THE GRAPH BRIDGE ---
import learningService from "../../learning/services/learning.service";
import ConceptModel from "../../concept/models/concept.model";
import { ConceptStatus } from "../../learning/models/learning-progress.model";

export class AIController {
  /**
   * GENERATE TEACHER LESSON (REST JSON)
   * Delivers full markdown pedagogy via standard JSON response.
   */
  static async generateLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonMarkdown = await teacherService.generateLesson(req.body);
      res.status(200).json({
        success: true,
        data: {
          content: lessonMarkdown,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * EVALUATE SUBMISSION & BACKEND DECISION ENGINE (Fast Tier / Groq)
   * AI calculates mastery score; backend deterministically controls node progression.
   */
  static async evaluateSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      // Assuming your auth middleware populates req.user
      const userId = new Types.ObjectId((req as any).user.id);
      const { conceptId } = req.body;

      // 1. AI reasoning step
      const evaluation = (await evaluatorService.evaluateSubmission(
        req.body
      )) as any;

      // Safely extract mastery score across both flat and nested evaluation formats
      const masteryScore =
        evaluation.mastery ??
        evaluation.evaluationResult?.masteryPercentage ??
        0;

      // 2. DETERMINISTIC BACKEND DECISION LAYER
      // We pass the AI's grade to the database gatekeeper to handle unlocks
      const dbResult = await learningService.recordEvaluationResult(
        conceptId,
        userId,
        masteryScore
      );

      // 3. Return response to frontend
      res.status(200).json({
        success: true,
        data: {
          evaluation,
          progress: dbResult.progress,
          unlockedDownstreamIds: dbResult.unlockedDownstreamIds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PLAN NEXT CONCEPT (Groq - Organizer Key)
   * Hydrates the user's graph state from the DB and generates the next optimal path.
   */
  static async planPath(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId, availableTimeMinutes } = req.body;
      const userId = new Types.ObjectId((req as any).user.id);

      // 1. Fetch all nodes in this workspace to build the graph
      const concepts = await ConceptModel.find({ workspace: workspaceId });
      const graphNodes = concepts.map((c) => c.conceptId);

      // 2. Fetch the user's specific progression state in this workspace
      const progressRecords = await learningService.getWorkspaceProgress(
        workspaceId,
        userId
      );

      // 3. Aggregate completed nodes and mastery map for the AI Planner
      const completedNodes: string[] = [];
      const masteryMap: Record<string, number> = {};

      progressRecords.forEach((record) => {
        // record.concept is populated with { conceptId, title, level } from learningService
        const conceptData = record.concept as any;
        masteryMap[conceptData.conceptId] = record.masteryScore;

        if (record.status === ConceptStatus.MASTERED) {
          completedNodes.push(conceptData.conceptId);
        }
      });

      // 4. Inject the hydrated state into the Organizer AI
      const plan = await plannerService.planNextStep({
        graphNodes,
        completedNodes,
        masteryMap,
        availableTimeMinutes,
      });

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GENERATE EXTERNAL RESOURCES (Groq - Organizer Key)
   */
  static async generateResources(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GENERATE STANDALONE DIAGNOSTIC QUIZ (Groq - Teacher Key)
   * Generates diagnostic questions for interactive concept checks.
   */
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