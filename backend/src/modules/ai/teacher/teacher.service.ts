import ConceptModel from "../../concept/models/concept.model";
import LessonModel from "../../concept/models/lesson.model";
import FlashcardModel from "../../learning/models/flashcard.model";
import QuizModel from "../../learning/models/quiz.model";
import WorkspaceModel from "../../workspace/models/workspace.model";
import { groqProvider } from "../providers/groq.provider";
import {
  TEACHER_SYSTEM_PROMPT,
  buildTier1ModulesPrompt,
  buildTier2SubtopicsPrompt,
  buildTier3LessonPrompt,
} from "./teacher.prompt";

export class TeacherService {
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
    const rawData = await groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.2 },
    );

    const modules = Array.isArray(rawData?.modules) ? rawData.modules : [];
    const createdConcepts = [];

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const conceptId = `concept_${context.workspaceId}_${i + 1}`;

      const concept = await ConceptModel.create({
        conceptId,
        workspace: context.workspaceId,
        owner: context.ownerId,
        title: mod.title,
        description: mod.description,
        order: i + 1,
        // First module is unlocked by default; downstream modules are locked
        isUnlocked: i === 0,
        isMastered: false,
        topics: [],
      });

      createdConcepts.push(concept);
    }

    return createdConcepts;
  }

  /**
   * TIER 2: Generate Subtopics (2nd Pillars)
   * Triggered when clicking a Module node. Checks DB cache first.
   */
  async generateTier2Subtopics(context: {
    conceptId: string;
    workspaceTitle: string;
    moduleTitle: string;
    moduleDescription?: string;
    forceRefresh?: boolean;
  }): Promise<any[]> {
    const { conceptId, forceRefresh } = context;

    // 1. DB Cache Check
    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new Error(`Concept module not found for ID: ${conceptId}`);
    }

    if (concept.topics && concept.topics.length > 0 && !forceRefresh) {
      console.log(
        `[TeacherService] Tier 2: Returning cached subtopics from DB for: ${conceptId}`,
      );
      return concept.topics;
    }

    // 2. JIT AI Generation
    console.log(
      `[TeacherService] Tier 2: Generating fresh subtopics for module: ${context.moduleTitle}`,
    );
    const prompt = buildTier2SubtopicsPrompt(context);
    const rawData = await groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 },
    );

    const subtopics = Array.isArray(rawData?.subtopics)
      ? rawData.subtopics
      : [];

    // 3. Save Subtopics Array to Concept Document
    concept.topics = subtopics;
    await concept.save();

    return subtopics;
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

    const concept = await ConceptModel.findOne({ conceptId });
    if (!concept) {
      throw new Error(`Concept module not found for ID: ${conceptId}`);
    }

    // Fetch workspace document to resolve string custom workspaceId -> Mongo _id
    const workspaceDoc = await WorkspaceModel.findOne({
      $or: [
        { workspaceId },
        { _id: workspaceId.match(/^[0-9a-fA-F]{24}$/) ? workspaceId : null },
      ],
    });

    if (!workspaceDoc) {
      throw new Error(`Workspace not found for ID: ${workspaceId}`);
    }

    const mongoWorkspaceId = workspaceDoc._id;

    // 1. DB Cache Check across dedicated models
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

    // 2. JIT AI Generation
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
      rawData?.markdownContent || "Content generation failed.";
    const flashcardsData = Array.isArray(rawData?.flashcards)
      ? rawData.flashcards
      : [];
    const quizData = Array.isArray(rawData?.quiz) ? rawData.quiz : [];

    // 3. Atomically update/save to dedicated collections
    const [savedLesson, savedCards, savedQuiz] = await Promise.all([
      // Upsert Lesson Document
      LessonModel.findOneAndUpdate(
        { concept: concept._id, subtopicId },
        {
          subtopicId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerId,
          markdownContent,
        },
        { upsert: true, returnDocument: "after" },
      ),

      // Refresh Flashcard Documents
      (async () => {
        await FlashcardModel.deleteMany({ concept: concept._id, subtopicId });
        const cardsToInsert = flashcardsData.map((card: any) => ({
          subtopicId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerId,
          front: card.front || "Question prompt",
          back: card.back || "Answer details",
        }));
        return FlashcardModel.insertMany(cardsToInsert);
      })(),

      // Upsert Quiz Document
      QuizModel.findOneAndUpdate(
        { concept: concept._id, subtopicId },
        {
          subtopicId,
          concept: concept._id,
          workspace: mongoWorkspaceId,
          owner: ownerId,
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
