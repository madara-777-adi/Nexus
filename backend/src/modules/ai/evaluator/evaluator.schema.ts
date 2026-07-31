import { z } from "zod";

export const EvaluationResultSchema = z.object({
  masteryScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  missingPrerequisites: z.array(z.string()).default([]),
  recommendation: z.string().default(""),
});

export type IEvaluationResult = z.infer<typeof EvaluationResultSchema>;
