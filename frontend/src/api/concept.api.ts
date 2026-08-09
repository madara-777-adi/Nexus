import api from "./axios";
import type { IConcept } from "../types/workspace.types";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Matches the real backend routes in modules/concept/routes/concept.routes.ts:
 *   GET    /workspaces/:workspaceId/concepts
 *   GET    /concepts/:conceptId
 *   PATCH  /concepts/:conceptId
 *   DELETE /concepts/:conceptId
 * (POST /workspaces/:workspaceId/concepts exists too, but concept creation
 * in this app happens exclusively through Tier-1 AI generation — see
 * ai.api.ts#getTier1Modules — not manual creation, so it's not wrapped here.)
 */
export const conceptApi = {
  getConceptsByWorkspace: async (
    workspaceId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<IConcept[]>> => {
    const res = await api.get(`/workspaces/${workspaceId}/concepts`, {
      signal,
    });
    return res.data;
  },

  getConceptById: async (
    conceptId: string,
  ): Promise<ApiResponse<IConcept>> => {
    const res = await api.get(`/concepts/${conceptId}`);
    return res.data;
  },
};
