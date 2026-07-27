import { z } from "zod";
import { WorkspaceVisibility } from "../models/workspace.model";

export const createWorkspaceSchema = z.object({
  title: z
    .string()
    .min(1, "Workspace title is required")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  visibility: z.nativeEnum(WorkspaceVisibility).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const workspaceParamSchema = z.object({
  id: z.string().min(1, "Workspace ID parameter is required"),
});

export type CreateWorkspaceDTO = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceDTO = z.infer<typeof updateWorkspaceSchema>;