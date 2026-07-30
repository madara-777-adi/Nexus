import API from "./axios";
import type { EvaluationResult, QuizQuestion } from "../types/ai.types";
import type { ILearningProgress } from "../types/learning.types";

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

export const generateLesson = async (payload: {
  workspaceId?: string;
  workspaceTitle: string;
  conceptId?: string;
  conceptTitle: string;
  conceptDescription?: string;
  difficulty?: string;
  preferredDepth?: string;
}) => {
  const response = await API.post("/ai/teacher/lesson", payload);
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
