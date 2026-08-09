import API from "./axios";
import type {
  EvaluationResult,
  LearningExperiencePayload,
  LessonDifficulty,
  QuizQuestion,
  Tier3LessonPayload,
} from "../types/ai.types";
import type { ILearningProgress } from "../types/learning.types";
import type { IConceptTopic, ILessonNode } from "../types/workspace.types";

/**
 * TIER 1: Generate Top-Level Workspace Modules (1st Pillars)
 */
export const getTier1Modules = async (payload: {
  workspaceId: string;
  workspaceTitle: string;
  workspaceDescription?: string;
}) => {
  const response = await API.post("/ai/teacher/tier1-modules", payload);
  return response.data;
};

/**
 * TIER 2: Generate Chapters for a Unit (JIT; cached server-side).
 * The backend schema names the unit title field `moduleTitle` — the wire has no
 * `conceptTitle` field — so the unit title is supplied via `moduleTitle`.
 */
export const getTier2Subtopics = async (payload: {
  conceptId: string;
  workspaceTitle: string;
  moduleTitle: string;
  moduleDescription?: string;
  difficulty?: LessonDifficulty;
  forceRefresh?: boolean;
}) => {
  const response = await API.post<{
    success: boolean;
    data: IConceptTopic[];
  }>("/ai/teacher/tier2-subtopics", payload);
  return response.data.data;
};

/**
 * TIER 3: Generate Lesson Node metadata for a Chapter (JIT; cached server-side).
 * Returns LessonNode metadata only — never markdown/flashcards/quiz.
 */
export const getTier3Lessons = async (payload: {
  conceptId: string;
  workspaceTitle: string;
  moduleTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterDescription?: string;
  difficulty?: LessonDifficulty;
  forceRefresh?: boolean;
}) => {
  const response = await API.post<{
    success: boolean;
    data: ILessonNode[];
  }>("/ai/teacher/tier3-lessons", payload);
  return response.data.data;
};

/**
 * TIER 4: Generate Learning Experience (markdown, flashcards & quiz) for a
 * Lesson Node. Identity is the REAL lessonId — never fabricated.
 */
export const getLearningExperience = async (
  payload: LearningExperiencePayload,
) => {
  const response = await API.post<{
    success: boolean;
    data: Tier3LessonPayload;
  }>("/ai/teacher/lesson-experience", payload);
  return response.data.data;
};

/**
 * EVALUATION & PLANNING
 */
export const evaluateSubmission = async (payload: {
  /**
   * @deprecated The evaluator schema does not accept workspaceId (it is stripped
   * server-side). Retained as optional only for the unmigrated TeacherStudio
   * caller; new callers must not send it.
   */
  workspaceId?: string;
  conceptId: string;
  conceptTitle: string;
  questions: QuizQuestion[];
  learnerAnswers: Array<{
    questionId?: string;
    question: string;
    userAnswer: string;
    correctAnswer?: string;
  }>;
}) => {
  const response = await API.post<{
    success: boolean;
    data: {
      evaluation: EvaluationResult;
      progress: ILearningProgress | unknown;
      unlockedDownstreamIds: string[];
    };
  }>("/ai/evaluator/evaluate", payload);
  return response.data.data;
};

export const planNextPath = async (payload: {
  workspaceId: string;
  availableTimeMinutes?: number;
}) => {
  const response = await API.post<{
    success: boolean;
    data: {
      // Matches the backend PathPlan returned by plannerService.planNextStep.
      nextConcept: string;
      reason: string;
      estimatedStudyTime: string;
      revisionNeeded: boolean;
      suggestedResources: string[];
      suggestedDifficulty: string;
      /**
       * @deprecated Fields the backend never returns. The real planner response
       * names the recommendation `nextConcept`. Typed `never` so nothing can
       * ever be assigned to them; they exist only so the unmigrated WorkspacePage
       * caller (which still reads recommendedNodeId/recommendedNodeTitle)
       * continues to typecheck until that caller is migrated.
       */
      recommendedNodeId?: never;
      recommendedNodeTitle?: never;
    };
  }>("/ai/planner/plan", payload);
  return response.data.data;
};

export const generateResources = async (payload: {
  conceptTitle: string;
  domain: string;
  targetCount?: number;
}) => {
  const response = await API.post("/ai/generator/resources", payload);
  return response.data.data;
};