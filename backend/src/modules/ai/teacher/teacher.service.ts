import { Types } from "mongoose";
import ConceptModel from "../../concept/models/concept.model";
import LessonModel from "../../concept/models/lesson.model";
import FlashcardModel from "../../learning/models/flashcard.model";
import QuizModel from "../../learning/models/quiz.model";
import WorkspaceModel from "../../workspace/models/workspace.model";
import { groqProvider } from "../providers/groq.provider";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import {
  TEACHER_SYSTEM_PROMPT,
  buildTier1ModulesPrompt,
  buildTier2TopicsPrompt,
  buildTier3LessonPrompt,
} from "./teacher.prompt";

export interface RawTopicAIOutput {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface RawTopicResponseDTO {
  topics: RawTopicAIOutput[];
}

export class TeacherService {
  /**
   * Pure AI Orchestration: Generate Tier 2 Topics
   * Generates, validates, and returns structured topic DTOs without performing DB persistence or state assignment.
   */
  async generateTopics(context: {
    conceptTitle: string;
    conceptDescription?: string;
    workspaceContext?: {
      workspaceTitle: string;
    };
  }): Promise<RawTopicResponseDTO> {
    const prompt = buildTier2TopicsPrompt(context);

    const rawData = await groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      {
        temperature: 0.3,
      },
    );

    const rawTopics = Array.isArray(rawData?.topics) ? rawData.topics : [];

    const mappedTopics: RawTopicAIOutput[] = rawTopics.map((topic: any) => ({
      title: String(topic.title || "").trim(),
      description: String(topic.description || "").trim(),
      estimatedMinutes:
        typeof topic.estimatedMinutes === "number" && topic.estimatedMinutes > 0
          ? topic.estimatedMinutes
          : 15,
    }));

    if (mappedTopics.length === 0) {
      throw new Error("AI generation failed to produce valid topics.");
    }

    return {
      topics: mappedTopics,
    };
  }

  /**
   * TIER 1: Generate Top-Level Modules (1st Pillars)
   * Triggered when creating a new workspace. Saves lightweight Concept documents.
   */
  async generateTier1Modules(context: {
    workspaceId: string;
    ownerId: string;
    workspaceTitle: string;
    workspaceDescription?: string;
  }): Promise<any[]> {
    console.log(
      `[TeacherService] Tier 1: Generating modules for workspace: ${context.workspaceTitle}`,
    );

    const prompt = buildTier1ModulesPrompt(context);
    let rawData: any = null;

    try {
      rawData = await groqProvider.generateJSON(
        prompt,
        TEACHER_SYSTEM_PROMPT,
        "teacher",
        { temperature: 0.2 },
      );
    } catch (err) {
      console.error("[TeacherService] Tier 1 AI generation error:", err);
    }

    let modules = Array.isArray(rawData?.modules) ? rawData.modules : [];

    if (modules.length === 0) {
      console.warn(
        `[TeacherService] Tier 1 returned empty modules array. Applying multi-module fallback roadmap.`,
      );

      modules = [
        {
          title: `1. ${context.workspaceTitle} Fundamentals`,
          description: `Core concepts, syntax, and basic architecture for ${context.workspaceTitle}.`,
        },
        {
          title: `2. Data Control & Logical Flow`,
          description:
            "Methods, state management, and algorithmic control structures.",
        },
        {
          title: `3. Intermediate System Patterns`,
          description:
            "Modular design, error boundaries, and standard library mechanisms.",
        },
        {
          title: `4. Advanced Implementation & Mastery`,
          description:
            "Optimization, edge-case mitigation, and production deployment patterns.",
        },
      ];
    }

    const isObjectId = Types.ObjectId.isValid(context.workspaceId);
    const workspaceDoc = await WorkspaceModel.findOne(
      isObjectId
        ? {
            $or: [
              { workspaceId: context.workspaceId },
              { _id: context.workspaceId },
            ],
          }
        : { workspaceId: context.workspaceId },
    );

    if (!workspaceDoc) {
      throw new NotFoundError(`Workspace not found: ${context.workspaceId}`);
    }

    const ownerObjectId = new Types.ObjectId(context.ownerId);
    if (!workspaceDoc.owner.equals(ownerObjectId)) {
      throw new ForbiddenError("You do not have access to this workspace.");
    }

    const mongoWorkspaceId = workspaceDoc._id;

    const createdConcepts: any[] = [];
    
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];

      let conceptId: string;
      do {
        conceptId = `concept_${generateUserId()}`;
      } while (await ConceptModel.exists({ conceptId }));

      const concept = await ConceptModel.create({
        conceptId,
        workspace: mongoWorkspaceId,
        owner: context.ownerId,
        title: mod.title,
        description: mod.description,
        order: i + 1,
        isUnlocked: i === 0,
        isMastered: false,
        topics: [],
      });

      createdConcepts.push(concept);
    }

    return createdConcepts;
  }

  /**
   * TIER 3: Generate Deep Lesson, Flashcards, and Quiz (The Deep Dive)
   * Triggered when clicking a specific Subtopic to learn. Saves across separate models.
   */
  async generateTier3Lesson(context: {
    conceptId: string;
    subtopicId: string;
    workspaceId: string;
    ownerId: string;
    workspaceTitle: string;
    moduleTitle: string;
    subtopicTitle: string;
    forceRefresh?: boolean;
  }): Promise<any> {
    const { conceptId, subtopicId, workspaceId, ownerId, forceRefresh } =
      context;

    const isConceptObjectId = Types.ObjectId.isValid(conceptId);
    const concept = await ConceptModel.findOne(
      isConceptObjectId
        ? { $or: [{ conceptId }, { _id: conceptId }] }
        : { conceptId },
    );

    if (!concept) {
      throw new NotFoundError(`Concept module not found for ID: ${conceptId}`);
    }

    const isWorkspaceObjectId = Types.ObjectId.isValid(workspaceId);
    const workspaceDoc = await WorkspaceModel.findOne(
      isWorkspaceObjectId
        ? { $or: [{ workspaceId }, { _id: workspaceId }] }
        : { workspaceId },
    );

    if (!workspaceDoc) {
      throw new NotFoundError(`Workspace not found for ID: ${workspaceId}`);
    }

    const ownerObjectId = new Types.ObjectId(ownerId);
    if (!workspaceDoc.owner.equals(ownerObjectId)) {
      throw new ForbiddenError(
        "You do not have access to this workspace or lesson.",
      );
    }

    const mongoWorkspaceId = workspaceDoc._id;

    if (!forceRefresh) {
      const [existingLesson, existingCards, existingQuiz] = await Promise.all([
        LessonModel.findOne({ concept: concept._id, subtopicId }),
        FlashcardModel.find({ concept: concept._id, subtopicId }),
        QuizModel.findOne({ concept: concept._id, subtopicId }),
      ]);

      if (existingLesson && existingCards.length > 0 && existingQuiz) {
        console.log(
          `[TeacherService] Tier 3: Returning cached deep lesson payload for subtopic: ${subtopicId}`,
        );
        return {
          markdownContent: existingLesson.markdownContent,
          flashcards: existingCards,
          quiz: existingQuiz.questions,
        };
      }
    }

    console.log(
      `[TeacherService] Tier 3: Generating fresh deep lesson payload for: ${context.subtopicTitle}`,
    );
    const prompt = buildTier3LessonPrompt(context);
    const rawData = await groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 },
    );

    const markdownContent =
      rawData?.markdownContent ||
      "## Lesson Generation Notice\n\nContent generation failed. Please refresh.";
    const flashcardsData = Array.isArray(rawData?.flashcards)
      ? rawData.flashcards
      : [];
    const quizData = Array.isArray(rawData?.quiz) ? rawData.quiz : [];

    const [savedLesson, savedCards, savedQuiz] = await Promise.all([
      LessonModel.findOneAndUpdate(
        { concept: concept._id, subtopicId },
        {
          subtopicId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerObjectId,
          markdownContent,
        },
        { upsert: true, returnDocument: "after" },
      ),

      (async () => {
        await FlashcardModel.deleteMany({ concept: concept._id, subtopicId });
        const cardsToInsert = flashcardsData.map((card: any) => ({
          subtopicId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerObjectId,
          front: card.front || "Question prompt",
          back: card.back || "Answer details",
        }));
        return FlashcardModel.insertMany(cardsToInsert);
      })(),

      QuizModel.findOneAndUpdate(
        { concept: concept._id, subtopicId },
        {
          subtopicId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerObjectId,
          questions: quizData.map((q: any) => ({
            question: q?.question || "Question",
            options: Array.isArray(q?.options) ? q.options : [],
            answerIndex: typeof q?.answerIndex === "number" ? q.answerIndex : 0,
          })),
        },
        { upsert: true, returnDocument: "after" },
      ),
    ]);

    return {
      markdownContent: savedLesson.markdownContent,
      flashcards: savedCards,
      quiz: savedQuiz.questions,
    };
  }
}

export const teacherService = new TeacherService();
