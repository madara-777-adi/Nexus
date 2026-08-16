import { z } from "zod";

export const createConceptSchema = z.object({
  title: z
    .string()
    .min(1, "Concept title is required")
    .max(150, "Title cannot exceed 150 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
});

export const updateConceptSchema = createConceptSchema.partial();

export const workspaceConceptParamsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  conceptId: z.string().optional(),
});

export type CreateConceptDTO = z.infer<typeof createConceptSchema>;
export type UpdateConceptDTO = z.infer<typeof updateConceptSchema>;