import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const teacherStreamSchema = z.object({
  body: z.object({
    workspaceTitle: z.string().min(1, "Workspace title is required"),
    conceptTitle: z.string().min(1, "Concept title is required"),
    conceptDescription: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    preferredDepth: z.enum(["Overview", "Balanced", "Deep Dive"]).optional(),
  }),
});

export const evaluatorSchema = z.object({
  body: z.object({
    conceptTitle: z.string().min(1, "Concept title is required"),
    questions: z.array(z.any()).min(1, "At least one question is required"),
    learnerAnswers: z
      .array(
        z.object({
          questionId: z.string().optional(),
          question: z.string().min(1),
          userAnswer: z.string().min(1, "User answer cannot be empty"),
          correctAnswer: z.string().optional(),
        })
      )
      .min(1, "At least one answer must be submitted"),
  }),
});

export const plannerSchema = z.object({
  body: z.object({
    graphNodes: z.array(z.string()).min(1, "Graph nodes array cannot be empty"),
    completedNodes: z.array(z.string()),
    masteryMap: z.record(z.string(), z.number()),
    availableTimeMinutes: z.number().positive().optional(),
  }),
});

export const resourceGeneratorSchema = z.object({
  body: z.object({
    conceptTitle: z.string().min(1, "Concept title is required"),
    domain: z.string().min(1, "Domain is required"),
    targetCount: z.number().min(1).max(10).optional(),
  }),
});

export const quizGeneratorSchema = z.object({
  body: z.object({
    conceptTitle: z.string().min(1, "Concept title is required"),
    questionCount: z.number().min(1).max(20).optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  }),
});

// Middleware Factory to execute validation cleanly
export const validateAIRequest =
  (schema: z.ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Invalid AI Request Payload",
        errors: error.errors,
      });
    }
  };