import API from "./axios";
import type {
  EvaluationResult,
  QuizQuestion,
  Subtopic,
  Tier3LessonPayload,
} from "../types/ai.types";
import type { ILearningProgress } from "../types/learning.types";

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
 * TIER 2: Generate Module Subtopics (2nd Pillars)
 */
export const getTier2Subtopics = async (payload: {
  conceptId: string;
  workspaceTitle: string;
  moduleTitle: string;
  moduleDescription?: string;
  forceRefresh?: boolean;
}) => {
  const response = await API.post<{
    success: boolean;
    data: Subtopic[];
  }>("/ai/teacher/tier2-subtopics", payload);
  return response.data.data;
};

/**
 * TIER 3: Generate Deep Lesson, Flashcards & Diagnostic Quiz
 */
export const getTier3Lesson = async (payload: {
  conceptId: string;
  subtopicId: string;
  workspaceId: string;
  workspaceTitle: string;
  moduleTitle: string;
  subtopicTitle: string;
  forceRefresh?: boolean;
}) => {
  const response = await API.post<{
    success: boolean;
    data: Tier3LessonPayload;
  }>("/ai/teacher/tier3-lesson", payload);
  return response.data.data;
};

/**
 * EVALUATION & PLANNING
 */
export const evaluateSubmission = async (payload: {
  workspaceId: string;
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
  const response = await API.post("/ai/planner/plan", payload);
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