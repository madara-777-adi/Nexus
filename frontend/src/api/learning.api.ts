import API from "./axios";
import type { ILearningProgress, EvaluationRecordResponse } from "../types/learning.types";

export const initializeWorkspaceProgress = async (workspaceId: string) => {
  const response = await API.post<{ success: boolean; data: ILearningProgress[] }>(
    `/workspaces/${workspaceId}/learning/init`
  );
  return response.data.data;
};

export const getWorkspaceProgress = async (workspaceId: string) => {
  const response = await API.get<{ success: boolean; data: ILearningProgress[] }>(
    `/workspaces/${workspaceId}/learning`
  );
  return response.data.data;
};

/**
  * @deprecated
  * Audit 3.1 Notice: Do NOT call this directly from UI components to set mastery scores.
  * Standard student evaluation must flow through `evaluateSubmission` in `ai.api.ts`
  * to ensure server-side AI evaluation and workspace ownership validation.
  */
export const recordEvaluationResult = async (conceptId: string, masteryScore: number) => {
  const response = await API.post<{ success: boolean; data: EvaluationRecordResponse }>(
    `/learning/record`,
    { conceptId, masteryScore }
  );
  return response.data.data;
};