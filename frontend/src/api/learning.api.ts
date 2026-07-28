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

export const recordEvaluationResult = async (conceptId: string, masteryScore: number) => {
  const response = await API.post<{ success: boolean; data: EvaluationRecordResponse }>(
    `/learning/record`,
    { conceptId, masteryScore }
  );
  return response.data.data;
};