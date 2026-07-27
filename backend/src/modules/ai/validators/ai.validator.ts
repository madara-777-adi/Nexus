import { z } from "zod";

export const generateResourceSchema = z.object({
  userInstructions: z
    .string()
    .max(500, "Instructions cannot exceed 500 characters")
    .optional(),
});

export const conceptParamsSchema = z.object({
  conceptId: z.string().min(1, "Concept ID is required"),
});

export type GenerateResourceDTO = z.infer<typeof generateResourceSchema>;