import api from "./axios";
import type {
  IWorkspace,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from "../types/workspace.types";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const workspaceApi = {
  createWorkspace: async (
    payload: CreateWorkspacePayload,
  ): Promise<ApiResponse<IWorkspace>> => {
    const res = await api.post("/workspaces", payload);
    return res.data;
  },

  getAllWorkspaces: async (): Promise<ApiResponse<IWorkspace[]>> => {
    const res = await api.get("/workspaces");
    return res.data;
  },

  getWorkspaceById: async (
    workspaceId: string,
  ): Promise<ApiResponse<IWorkspace>> => {
    const res = await api.get(`/workspaces/${workspaceId}`);
    return res.data;
  },

  updateWorkspace: async (
    workspaceId: string,
    payload: UpdateWorkspacePayload,
  ): Promise<ApiResponse<IWorkspace>> => {
    const res = await api.patch(`/workspaces/${workspaceId}`, payload);
    return res.data;
  },

  deleteWorkspace: async (
    workspaceId: string,
  ): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/workspaces/${workspaceId}`);
    return res.data;
  },
};