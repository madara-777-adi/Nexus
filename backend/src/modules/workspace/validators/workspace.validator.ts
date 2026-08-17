import { z } from "zod";

export const createWorkspaceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Workspace title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const workspaceParamSchema = z.object({
  id: z.string().min(1, "Workspace ID parameter is required"),
});

export type CreateWorkspaceDTO = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceDTO = z.infer<typeof updateWorkspaceSchema>;
