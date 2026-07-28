import { z } from "zod";
import { ResourceSource } from "../models/resource.model";

const structuredContentZodSchema = z.object({
  definition: z.string().max(2000).optional(),
  whyItExists: z.string().max(2000).optional(),
  howItWorks: z.string().max(5000).optional(),
  example: z.string().max(2000).optional(),
  keyPoints: z.array(z.string().max(500)).optional(),
  commonMisconceptions: z.string().max(2000).optional(),
  relatedConcepts: z.array(z.string().max(100)).optional(),
  summary: z.string().max(1000).optional(),
  rawText: z.string().max(10000).optional(),
});

export const createResourceSchema = z.object({
  title: z
    .string()
    .min(1, "Resource title is required")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  source: z.nativeEnum(ResourceSource).optional(),
  content: structuredContentZodSchema,
});

export const updateResourceSchema = createResourceSchema.partial();

export const conceptResourceParamsSchema = z.object({
  conceptId: z.string().min(1, "Concept ID is required"),
});

export const resourceParamsSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
});

export type CreateResourceDTO = z.infer<typeof createResourceSchema>;
export type UpdateResourceDTO = z.infer<typeof updateResourceSchema>;