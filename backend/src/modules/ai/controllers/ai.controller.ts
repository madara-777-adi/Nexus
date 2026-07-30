import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { teacherService } from "../teacher/teacher.service";
import { evaluatorService } from "../evaluator/evaluator.service";
import { plannerService } from "../planner/planner.service";
import { quizGeneratorService } from "../generator/quiz-generator.service";

// --- GRAPH BRIDGE & MODELS ---
import learningService from "../../learning/services/learning.service";
import ConceptModel from "../../concept/models/concept.model";
import { ConceptStatus } from "../../learning/models/learning-progress.model";

export class AIController {
  /**
   * TIER 1: GENERATE WORKSPACE MODULES (1st Pillars)
   * Triggered upon workspace creation to build progressive concept nodes.
   */
  static async generateTier1Modules(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { workspaceId, workspaceTitle, workspaceDescription } = req.body;

      const modules = await teacherService.generateTier1Modules({
        workspaceId,
        ownerId: userId,
        workspaceTitle,
        workspaceDescription,
      });

      return res.status(200).json({
        success: true,
        message: "Tier 1 workspace modules generated successfully",
        data: modules,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TIER 2: GENERATE MODULE SUBTOPICS (2nd Pillars)
   * Triggered JIT when a user selects a specific concept node.
   */
  static async generateTier2Subtopics(req: Request, res: Response, next: NextFunction) {
    try {
      const { conceptId, workspaceTitle, moduleTitle, moduleDescription, forceRefresh } = req.body;

      const subtopics = await teacherService.generateTier2Subtopics({
        conceptId,
        workspaceTitle,
        moduleTitle,
        moduleDescription,
        forceRefresh,
      });

      return res.status(200).json({
        success: true,
        message: "Tier 2 subtopics retrieved successfully",
        data: subtopics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TIER 3: GENERATE DEEP LESSON, FLASHCARDS & QUIZ
   * Triggered JIT when a user clicks a subtopic to launch the deep-dive view.
   */
  static async generateTier3Lesson(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const {
        conceptId,
        subtopicId,
        workspaceId,
        workspaceTitle,
        moduleTitle,
        subtopicTitle,
        forceRefresh,
      } = req.body;

      const lessonPayload = await teacherService.generateTier3Lesson({
        conceptId,
        subtopicId,
        workspaceId,
        ownerId: userId,
        workspaceTitle,
        moduleTitle,
        subtopicTitle,
        forceRefresh,
      });

      return res.status(200).json({
        success: true,
        message: "Tier 3 deep lesson payload generated successfully",
        data: lessonPayload, // Returns { markdownContent, flashcards, quiz }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * EVALUATE SUBMISSION & BACKEND DECISION ENGINE
   * Calculates score and updates node progression state in DB.
   */
  static async evaluateSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = new Types.ObjectId((req as any).user.id);
      const { conceptId } = req.body;

      const evaluation = (await evaluatorService.evaluateSubmission(req.body)) as any;

      const masteryScore =
        evaluation.mastery ?? evaluation.evaluationResult?.masteryPercentage ?? 0;

      const dbResult = await learningService.recordEvaluationResult(
        conceptId,
        userId,
        masteryScore
      );

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
   * PLAN NEXT CONCEPT
   * Hydrates the user's graph state from the DB and generates the next optimal path.
   */
  static async planPath(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId, availableTimeMinutes } = req.body;
      const userId = new Types.ObjectId((req as any).user.id);

      const concepts = await ConceptModel.find({ workspace: workspaceId });
      const graphNodes = concepts.map((c) => c.conceptId);

      const progressRecords = await learningService.getWorkspaceProgress(
        workspaceId,
        userId
      );

      const completedNodes: string[] = [];
      const masteryMap: Record<string, number> = {};

      progressRecords.forEach((record) => {
        const conceptData = record.concept as any;
        masteryMap[conceptData.conceptId] = record.masteryScore;

        if (record.status === ConceptStatus.MASTERED) {
          completedNodes.push(conceptData.conceptId);
        }
      });

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
   * GENERATE EXTERNAL RESOURCES
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
   * GENERATE STANDALONE DIAGNOSTIC QUIZ
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