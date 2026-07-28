import API from "./axios";
import type { EvaluationResult } from "../types/ai.types";

export const evaluateSubmission = async (payload: {
  conceptTitle: string;
  questions: any[];
  learnerAnswers: Array<{
    question: string;
    userAnswer: string;
  }>;
}) => {
  const response = await API.post<{
    success: boolean;
    data: { evaluation: EvaluationResult; unlocked: boolean };
  }>("/ai/evaluator/evaluate", payload);
  return response.data.data;
};