import mongoose, { Types, ClientSession } from "mongoose";
import crypto from "crypto";
import ConceptModel, { ITopic, ILessonNode } from "../../concept/models/concept.model";
import LessonModel from "../../concept/models/lesson.model";
import FlashcardModel from "../../learning/models/flashcard.model";
import QuizModel from "../../learning/models/quiz.model";
import WorkspaceModel from "../../workspace/models/workspace.model";
import { ProviderFactory } from "../providers/provider.factory";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import {
  TEACHER_SYSTEM_PROMPT,
  buildTier1ModulesPrompt,
  buildTier2TopicsPrompt,
  buildTier3LessonsPrompt,
  buildLearningExperiencePrompt,
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
   * Helper to execute database operations inside a Mongo transaction when supported (Replica Sets / Atlas),
   * falling back cleanly to non-transactional execution for standalone MongoDB setups (local dev).
   */
  private async executeWithTransactionFallback<T>(
    operation: (session: ClientSession | null) => Promise<T>,
  ): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      return result!;
    } catch (err: any) {
      const isTransactionUnsupported =
        err?.code === 20 ||
        err?.codeName === "TransactionNumbersAreOnlyAllowedOnReplicaSet" ||
        (typeof err?.message === "string" &&
          (err.message.includes("Transaction numbers are only allowed") ||
            err.message.includes("does not support retryable writes")));

      if (isTransactionUnsupported) {
        console.warn(
          "[TeacherService] MongoDB Transactions unsupported on standalone instance. Executing fallback without session.",
        );
        return await operation(null);
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async generateTier2Subtopics(context: {
    conceptId: string;
    ownerId: string;
    workspaceTitle: string;
    moduleTitle: string;
    moduleDescription?: string;
    difficulty?: string;
    forceRefresh?: boolean;
  }): Promise<ITopic[]> {
    const concept = await ConceptModel.findOne({ conceptId: context.conceptId });
    if (!concept) {
      throw new NotFoundError(`Concept/Unit not found for ID: ${context.conceptId}`);
    }

    const ownerObjectId = new Types.ObjectId(context.ownerId);
    if (!concept.owner.equals(ownerObjectId)) {
      throw new ForbiddenError("You do not have permission to access this concept.");
    }

    if (!context.forceRefresh && concept.topics && concept.topics.length > 0) {
      console.log(
        `[TeacherService] Tier 2: Returning cached chapters for concept: ${context.conceptId}`,
      );
      return concept.topics;
    }

    console.log(
      `[TeacherService] Tier 2: Generating fresh chapters for Unit: ${context.moduleTitle}`,
    );

    const generated = await this.generateTopics({
      conceptTitle: context.moduleTitle,
      conceptDescription: context.moduleDescription,
      workspaceContext: {
        workspaceTitle: context.workspaceTitle,
      },
      difficulty: context.difficulty,
    });

    const populatedTopics: ITopic[] = generated.topics.map(
      (topic: RawTopicAIOutput, index: number) => ({
        id: `tpc_${crypto.randomUUID()}`,
        title: topic.title,
        description: topic.description,
        order: index + 1,
        estimatedMinutes: topic.estimatedMinutes,
        generationStatus: "COMPLETED",
        unlockRequirements: {},
        lessons: [],
      }),
    );

    // Deterministic chapter replacement (FIX 2): every Tier 2 generation issues
    // fresh chapter ids, so any AI-generated descendant row (Lesson / Flashcard
    // / Quiz) keyed by a subtopicId that is NOT in the new chapter set belongs
    // to an obsolete chapter and is removed. LearningProgress, evaluation
    // history and manual Resources are never touched, and no workspace-wide
    // deletion is used — everything is scoped by concept._id.
    const survivingSubtopicIds = new Set(
      populatedTopics.map((topic) => topic.id),
    );
    const obsoleteSubtopicFilter = {
      concept: concept._id,
      subtopicId: { $nin: [...survivingSubtopicIds] },
    };

    await this.executeWithTransactionFallback(async (session) => {
      const mongoOptions = session ? { session } : {};

      // Serialized on purpose: MongoDB rejects concurrent commands issued on
      // the same session inside a transaction (server error 117
      // ConflictingOperationInProgress), so these deletes must not run via
      // Promise.all. Same single transaction and identical filters/options.
      await LessonModel.deleteMany(obsoleteSubtopicFilter, mongoOptions);
      await FlashcardModel.deleteMany(obsoleteSubtopicFilter, mongoOptions);
      await QuizModel.deleteMany(obsoleteSubtopicFilter, mongoOptions);

      // Field-scoped atomic write: only `topics` is replaced. A concurrent
      // Tier 3 positional update (topics.$.lessons) or another Tier 2 refresh
      // can never clobber the whole document from a stale in-memory snapshot.
      await ConceptModel.updateOne(
        { _id: concept._id },
        { $set: { topics: populatedTopics } },
        mongoOptions,
      );
    });

    return populatedTopics;
  }

  async generateTier3Lessons(context: {
    conceptId: string;
    chapterId: string;
    ownerId: string;
    workspaceTitle: string;
    moduleTitle: string;
    chapterTitle: string;
    chapterDescription?: string;
    difficulty?: string;
    forceRefresh?: boolean;
  }): Promise<ILessonNode[]> {
    const concept = await ConceptModel.findOne({ conceptId: context.conceptId });
    if (!concept) {
      throw new NotFoundError(`Concept/Unit not found for ID: ${context.conceptId}`);
    }

    const ownerObjectId = new Types.ObjectId(context.ownerId);
    if (!concept.owner.equals(ownerObjectId)) {
      throw new ForbiddenError("You do not have permission to access this concept.");
    }

    const topicIndex = concept.topics.findIndex(
      (t) => t.id === context.chapterId,
    );

    if (topicIndex === -1) {
      throw new NotFoundError(
        `Chapter not found for ID: ${context.chapterId} inside Unit: ${context.conceptId}`,
      );
    }

    const targetTopic = concept.topics[topicIndex];

    if (
      !context.forceRefresh &&
      targetTopic.lessons &&
      targetTopic.lessons.length > 0
    ) {
      console.log(
        `[TeacherService] Tier 3: Returning cached lesson nodes for Chapter: ${context.chapterId}`,
      );
      return targetTopic.lessons;
    }

    console.log(
      `[TeacherService] Tier 3: Generating fresh lesson nodes for Chapter: ${context.chapterTitle}`,
    );

    const prompt = buildTier3LessonsPrompt({
      workspaceTitle: context.workspaceTitle,
      moduleTitle: context.moduleTitle,
      chapterTitle: context.chapterTitle,
      chapterDescription: context.chapterDescription,
      difficulty: context.difficulty,
    });

    const rawData = await ProviderFactory.getInstance()
      .getTier3Provider()
      .generate<any>(prompt, TEACHER_SYSTEM_PROMPT, { temperature: 0.3 });

    const rawLessons = Array.isArray(rawData?.lessons) ? rawData.lessons : [];

    const populatedLessons: ILessonNode[] = rawLessons.map(
      (lesson: any, index: number) => ({
        id: `lsn_${crypto.randomUUID()}`,
        title: String(lesson.title || "").trim(),
        description: String(lesson.description || "").trim(),
        order: index + 1,
        estimatedMinutes:
          typeof lesson.estimatedMinutes === "number" && lesson.estimatedMinutes > 0
            ? lesson.estimatedMinutes
            : 15,
        generationStatus: "COMPLETED",
      }),
    );

    // Deterministic lesson-node replacement (FIX 3): any AI-generated row
    // (Lesson / Flashcard / Quiz) keyed to this chapter whose lessonId is NOT
    // part of the new lesson-node set belongs to an obsolete lesson node and is
    // removed. Rows without a lessonId are legacy chapter-level deep lessons;
    // they are also removed because regenerating a chapter's lesson structure
    // makes them obsolete, and the unique {concept, subtopicId} constraints on
    // Lesson/Quiz mean a stale legacy row would block new experience upserts.
    // LearningProgress, evaluation history and manual Resources are untouched.
    const newLessonIds = new Set(populatedLessons.map((lesson) => lesson.id));
    const obsoleteLessonRowsFilter = {
      concept: concept._id,
      subtopicId: context.chapterId,
      $or: [
        { lessonId: { $exists: false } },
        { lessonId: { $nin: [...newLessonIds] } },
      ],
    };

    await this.executeWithTransactionFallback(async (session) => {
      const mongoOptions = session ? { session } : {};

      // Serialized on purpose: MongoDB rejects concurrent commands issued on
      // the same session inside a transaction (server error 117
      // ConflictingOperationInProgress), so these deletes must not run via
      // Promise.all. Same single transaction and identical filters/options.
      await LessonModel.deleteMany(obsoleteLessonRowsFilter, mongoOptions);
      await FlashcardModel.deleteMany(obsoleteLessonRowsFilter, mongoOptions);
      await QuizModel.deleteMany(obsoleteLessonRowsFilter, mongoOptions);

      // Stale-write guard (FIX 5): the lesson nodes are written with a
      // positional update that matches the CURRENT persisted topics array
      // (`topics.id: chapterId`). The old bug wrote the whole document back
      // from a stale snapshot, which could resurrect a pre-Tier-2 chapter set.
      // With this update, if a concurrent Tier 2 refresh already replaced the
      // chapters, the match fails and nothing is written at all.
      const updatedConcept = await ConceptModel.findOneAndUpdate(
        { _id: concept._id, "topics.id": context.chapterId },
        { $set: { "topics.$.lessons": populatedLessons } },
        { new: true, ...mongoOptions },
      );

      if (!updatedConcept) {
        throw new NotFoundError(
          `Chapter not found for ID: ${context.chapterId} inside Unit: ${context.conceptId}`,
        );
      }
    });

    return populatedLessons;
  }

  async generateLessonExperience(context: {
    conceptId: string;
    chapterId?: string;
    subtopicId?: string;
    lessonId: string;
    ownerId: string;
    workspaceId?: string;
    workspaceTitle: string;
    moduleTitle: string;
    chapterTitle?: string;
    subtopicTitle?: string;
    lessonTitle: string;
    difficulty?: string;
    forceRefresh?: boolean;
  }) {
    const concept = await ConceptModel.findOne({ conceptId: context.conceptId });
    if (!concept) {
      throw new NotFoundError(`Concept/Unit not found for ID: ${context.conceptId}`);
    }

    const ownerObjectId = new Types.ObjectId(context.ownerId);
    if (!concept.owner.equals(ownerObjectId)) {
      throw new ForbiddenError("You do not have permission to access this concept.");
    }

    const targetChapterId = context.chapterId || context.subtopicId;
    const topicIndex = concept.topics.findIndex(
      (t) => t.id === targetChapterId,
    );

    if (topicIndex === -1) {
      throw new NotFoundError(
        `Chapter not found for ID: ${targetChapterId} inside Unit: ${context.conceptId}`,
      );
    }

    const targetTopic = concept.topics[topicIndex];

    const lessonNode = targetTopic.lessons?.find(
      (l) => l.id === context.lessonId,
    );

    if (!lessonNode) {
      throw new NotFoundError(
        `Lesson node not found for ID: ${context.lessonId} inside Chapter: ${targetChapterId}`,
      );
    }

    let mongoWorkspaceId = concept.workspace;
    if (context.workspaceId) {
      const workspaceDoc = await WorkspaceModel.findOne(
        Types.ObjectId.isValid(context.workspaceId)
          ? { _id: context.workspaceId }
          : { workspaceId: context.workspaceId },
      );
      if (workspaceDoc) {
        mongoWorkspaceId = workspaceDoc._id;
      }
    }

    const effectiveSubtopicId = targetTopic.id;
    const effectiveChapterTitle =
      targetTopic.title ||
      context.chapterTitle ||
      context.subtopicTitle ||
      "Selected Chapter";

    if (!context.forceRefresh) {
      const [existingLesson, existingCards, existingQuiz] = await Promise.all([
        LessonModel.findOne({ concept: concept._id, lessonId: context.lessonId }),
        FlashcardModel.find({ concept: concept._id, lessonId: context.lessonId }),
        QuizModel.findOne({ concept: concept._id, lessonId: context.lessonId }),
      ]);

      if (existingLesson && existingCards.length > 0 && existingQuiz) {
        console.log(
          `[TeacherService] Learning Experience: Returning cached payload for lessonId: ${context.lessonId}`,
        );
        return {
          markdownContent: existingLesson.markdownContent,
          flashcards: existingCards,
          quiz: existingQuiz.questions,
        };
      }
    }

    console.log(
      `[TeacherService] Learning Experience: Generating fresh content for Lesson: ${context.lessonTitle} (${context.lessonId})`,
    );

    const prompt = buildLearningExperiencePrompt({
      workspaceTitle: context.workspaceTitle,
      moduleTitle: context.moduleTitle,
      chapterTitle: effectiveChapterTitle,
      lessonTitle: context.lessonTitle,
      difficulty: context.difficulty,
    });

    const rawData = await ProviderFactory.getInstance()
      .getTier3Provider()
      .generate<any>(prompt, TEACHER_SYSTEM_PROMPT, { temperature: 0.3 });

    const markdownContent =
      rawData?.markdownContent ||
      "## Lesson Generation Notice\n\nContent generation failed. Please refresh.";
    const flashcardsData = Array.isArray(rawData?.flashcards)
      ? rawData.flashcards
      : [];
    const quizData = Array.isArray(rawData?.quiz) ? rawData.quiz : [];

    return this.executeWithTransactionFallback(async (session) => {
      const mongoOptions = session ? { session } : {};

      // Stale-write guard (FIX 5): the AI generation above ran against a
      // snapshot of the curriculum. Before persisting any payload rows,
      // re-read the CURRENT state and verify the chapter and lesson node still
      // exist. A concurrent Tier 2 refresh (new chapter ids) or Tier 3 refresh
      // (new lesson ids) must never receive generated Lesson/Flashcard/Quiz
      // rows for content that no longer exists in the curriculum.
      const freshConcept = session
        ? await ConceptModel.findById(concept._id).session(session)
        : await ConceptModel.findById(concept._id);

      const freshTopic = freshConcept?.topics?.find(
        (t) => t.id === targetChapterId,
      );

      if (!freshTopic) {
        throw new NotFoundError(
          `Chapter not found for ID: ${targetChapterId} inside Unit: ${context.conceptId}`,
        );
      }

      const freshLessonNode = freshTopic.lessons?.find(
        (l) => l.id === context.lessonId,
      );

      if (!freshLessonNode) {
        throw new NotFoundError(
          `Lesson node not found for ID: ${context.lessonId} inside Chapter: ${targetChapterId}`,
        );
      }

      // Serialized on purpose: MongoDB rejects concurrent commands issued on
      // the same session inside a transaction (server error 117
      // ConflictingOperationInProgress), so these upserts/deletes must not run
      // via Promise.all. Same single transaction and identical operations.
      const savedLesson = await LessonModel.findOneAndUpdate(
        { concept: concept._id, lessonId: context.lessonId },
        {
          subtopicId: effectiveSubtopicId,
          lessonId: context.lessonId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerObjectId,
          markdownContent,
        },
        { upsert: true, returnDocument: "after", ...mongoOptions },
      );

      await FlashcardModel.deleteMany(
        { concept: concept._id, lessonId: context.lessonId } as any,
        mongoOptions,
      );
      const cardsToInsert = flashcardsData.map((card: any) => ({
        subtopicId: effectiveSubtopicId,
        lessonId: context.lessonId,
        concept: concept._id,
        workspace: mongoWorkspaceId,
        owner: ownerObjectId,
        front: card.front || "Question prompt",
        back: card.back || "Answer details",
      }));
      const savedCards = await FlashcardModel.insertMany(
        cardsToInsert,
        mongoOptions,
      );

      const savedQuiz = await QuizModel.findOneAndUpdate(
        { concept: concept._id, lessonId: context.lessonId },
        {
          subtopicId: effectiveSubtopicId,
          lessonId: context.lessonId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerObjectId,
          questions: quizData.map((q: any) => ({
            question: q?.question || "Question",
            options: Array.isArray(q?.options) ? q.options : [],
            answerIndex: typeof q?.answerIndex === "number" ? q.answerIndex : 0,
          })),
        },
        { upsert: true, returnDocument: "after", ...mongoOptions },
      );

      return {
        markdownContent: savedLesson.markdownContent,
        flashcards: savedCards,
        quiz: savedQuiz.questions,
      };
    });
  }

  async generateTopics(context: {
    conceptTitle: string;
    conceptDescription?: string;
    workspaceContext?: {
      workspaceTitle: string;
    };
    difficulty?: string;
  }): Promise<RawTopicResponseDTO> {
    const prompt = buildTier2TopicsPrompt(context);

    const rawData = await ProviderFactory.getInstance()
      .getTier2Provider()
      .generate<any>(prompt, TEACHER_SYSTEM_PROMPT, { temperature: 0.3 });

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
      rawData = await ProviderFactory.getInstance()
        .getTier1Provider()
        .generate<any>(prompt, TEACHER_SYSTEM_PROMPT, { temperature: 0.2 });
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

  }

export const teacherService = new TeacherService();
