import { z } from "zod";

export const recordProgressSchema = z.object({
  conceptId: z.string().min(1, "Concept ID is required"),
  masteryScore: z
    .number()
    .min(0, "Mastery score cannot be less than 0")
    .max(100, "Mastery score cannot exceed 100"),
});

export const workspaceProgressParamsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export type RecordProgressDTO = z.infer<typeof recordProgressSchema>;