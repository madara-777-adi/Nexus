import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { teacherService } from "../teacher/teacher.service";
import { evaluatorService } from "../evaluator/evaluator.service";
import { plannerService } from "../planner/planner.service";
import { quizGeneratorService } from "../generator/quiz-generator.service";
import { resourceGeneratorService } from "../generator/resource-generator.service";
import { NotFoundError } from "../../../shared/errors/NotFoundError";

// --- GRAPH BRIDGE & MODELS ---
import Workspace from "../../workspace/models/workspace.model";
import learningService from "../../learning/services/learning.service";
import ConceptModel from "../../concept/models/concept.model";
import { ConceptStatus } from "../../learning/models/learning-progress.model";

export class AIController {
  /**
   * TIER 1: GENERATE WORKSPACE MODULES (1st Pillars)
   * Triggered upon workspace creation to build progressive concept nodes.
   */
  static async generateTier1Modules(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
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
   * TIER 2: GENERATE CHAPTERS FOR ONE SELECTED UNIT
   * Triggered JIT when a user expands a Unit to view its Chapters.
   */
  static async generateTier2Subtopics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const {
        conceptId,
        workspaceTitle,
        moduleTitle,
        moduleDescription,
        difficulty,
        forceRefresh,
      } = req.body;

      const chapters = await teacherService.generateTier2Subtopics({
        conceptId,
        ownerId: userId?.toString(),
        workspaceTitle,
        moduleTitle,
        moduleDescription,
        difficulty,
        forceRefresh: Boolean(forceRefresh),
      });

      return res.status(200).json({
        success: true,
        message: "Tier 2 chapters generated successfully",
        data: chapters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * TIER 3: GENERATE LESSON NODES FOR ONE SELECTED CHAPTER
   * Triggered JIT when a user expands a Chapter to view its learnable Lessons.
   */
  static async generateTier3Lessons(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const {
        conceptId,
        chapterId,
        subtopicId,
        workspaceTitle,
        moduleTitle,
        chapterTitle,
        subtopicTitle,
        chapterDescription,
        difficulty,
        forceRefresh,
      } = req.body;

      const targetChapterId = chapterId || subtopicId;
      const targetChapterTitle =
        chapterTitle || subtopicTitle || "Selected Chapter";

      const lessons = await teacherService.generateTier3Lessons({
        conceptId,
        chapterId: targetChapterId,
        ownerId: userId?.toString(),
        workspaceTitle,
        moduleTitle,
        chapterTitle: targetChapterTitle,
        chapterDescription,
        difficulty,
        forceRefresh: Boolean(forceRefresh),
      });

      return res.status(200).json({
        success: true,
        message: "Tier 3 lesson nodes generated successfully",
        data: lessons,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * LEARNING EXPERIENCE: GENERATE LESSON CONTENT, FLASHCARDS & QUIZ
   * Triggered JIT when a learner selects a specific LessonNode to study.
   */
  static async generateLessonExperience(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const {
        conceptId,
        chapterId,
        subtopicId,
        lessonId,
        workspaceId,
        workspaceTitle,
        moduleTitle,
        chapterTitle,
        subtopicTitle,
        lessonTitle,
        difficulty,
        forceRefresh,
      } = req.body;

      const experiencePayload = await teacherService.generateLessonExperience({
        conceptId,
        chapterId,
        subtopicId,
        lessonId,
        ownerId: userId?.toString(),
        workspaceId,
        workspaceTitle,
        moduleTitle,
        chapterTitle,
        subtopicTitle,
        lessonTitle,
        difficulty,
        forceRefresh: Boolean(forceRefresh),
      });

      return res.status(200).json({
        success: true,
        message: "Learning experience payload generated successfully",
        data: experiencePayload,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * EVALUATE SUBMISSION & BACKEND DECISION ENGINE
   * Calculates score and updates node progression state in DB.
   */
  static async evaluateSubmission(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userObjectId = new Types.ObjectId(
        (req as any).user._id || (req as any).user.id,
      );
      const { conceptId, chapterId, lessonId } = req.body;

      // Pre-flight authorization check BEFORE external AI execution
      await learningService.assertLessonEvaluationAccess(
        conceptId,
        chapterId,
        lessonId,
        userObjectId,
      );

      // 1. Get raw evaluation from Groq AI (Passes single req.body argument cleanly)
      const evaluation = (await evaluatorService.evaluateSubmission(
        req.body,
      )) as any;

      // 2. Map correct field names returned by EvaluatorService
      const masteryScore =
        evaluation.masteryScore ??
        evaluation.score ??
        evaluation.mastery ??
        evaluation.evaluationResult?.masteryPercentage ??
        0;

      // 3. Single internal call to persist score and trigger unlock cascades
      const dbResult = await learningService.recordLessonEvaluationResult(
        conceptId,
        chapterId,
        lessonId,
        userObjectId,
        masteryScore,
      );

      return res.status(200).json({
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

      const userObjectId = new Types.ObjectId(
        (req as any).user._id || (req as any).user.id,
      );

      // RC-004: Resolve public workspaceId -> Mongo ObjectId.
      // Scoped by owner up front so an unauthorized workspaceId is rejected
      // before we read any of its concepts, instead of after.
      const workspace = await Workspace.findOne({
        workspaceId,
        owner: userObjectId,
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found.");
      }

      const concepts = await ConceptModel.find({
        workspace: workspace._id,
      });

      const graphNodes = concepts.map((c) => c.conceptId);

      const progressRecords = await learningService.getWorkspaceProgress(
        workspaceId,
        userObjectId,
      );

      const completedNodes: string[] = [];
      const masteryMap: Record<string, number> = {};

      progressRecords.concepts.forEach((record) => {
        const conceptData = record.concept as any;

        if (conceptData) {
          masteryMap[conceptData.conceptId] = record.masteryScore;

          if (record.status === ConceptStatus.MASTERED) {
            completedNodes.push(conceptData.conceptId);
          }
        }
      });

      const plan = await plannerService.planNextStep({
        workspaceId,
        graphNodes,
        completedNodes,
        masteryMap,
        availableTimeMinutes,
      });

      return res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GENERATE EXTERNAL RESOURCES
   * Audit 4.4 Fix: Wired up to call resourceGeneratorService dynamically
   */
  static async generateResources(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const resources = await resourceGeneratorService.generateResources(
        req.body,
      );
      res.status(200).json({
        success: true,
        data: resources,
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
