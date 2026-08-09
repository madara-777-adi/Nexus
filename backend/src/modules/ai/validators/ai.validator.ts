import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Reusable String Constraints
const shortId = z.string().min(1).max(100, "ID cannot exceed 100 characters");
const titleText = z
  .string()
  .min(1)
  .max(150, "Title cannot exceed 150 characters");
const descriptionText = z
  .string()
  .max(3000, "Description cannot exceed 3000 characters");

export const tier1ModulesSchema = z.object({
  body: z.object({
    workspaceId: shortId,
    workspaceTitle: titleText,
    workspaceDescription: descriptionText.optional(),
  }),
});

export const tier2SubtopicsSchema = z.object({
  body: z.object({
    conceptId: shortId,
    workspaceTitle: titleText,
    moduleTitle: titleText,
    moduleDescription: descriptionText.optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    forceRefresh: z.boolean().optional(),
  }),
});

export const tier3LessonsSchema = z.object({
  body: z.object({
    conceptId: shortId,
    chapterId: shortId.optional(),
    subtopicId: shortId.optional(),
    workspaceTitle: titleText,
    moduleTitle: titleText,
    chapterTitle: titleText.optional(),
    subtopicTitle: titleText.optional(),
    chapterDescription: descriptionText.optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    forceRefresh: z.boolean().optional(),
  }),
});

export const lessonExperienceSchema = z.object({
  body: z.object({
    conceptId: shortId,
    chapterId: shortId.optional(),
    subtopicId: shortId.optional(),
    lessonId: shortId,
    workspaceId: shortId.optional(),
    workspaceTitle: titleText,
    moduleTitle: titleText,
    chapterTitle: titleText.optional(),
    subtopicTitle: titleText.optional(),
    lessonTitle: titleText,
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    forceRefresh: z.boolean().optional(),
  }),
});

export const tier3LessonSchema = z.object({
  body: z.object({
    conceptId: shortId,
    subtopicId: shortId,
    workspaceId: shortId,
    workspaceTitle: titleText,
    moduleTitle: titleText,
    subtopicTitle: titleText,
    forceRefresh: z.boolean().optional(),
  }),
});

export const teacherStreamSchema = z.object({
  body: z.object({
    workspaceTitle: titleText,
    conceptTitle: titleText,
    conceptDescription: descriptionText.optional(),
    prerequisites: z
      .array(z.string().max(150))
      .max(20, "Cannot exceed 20 prerequisites")
      .optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    preferredDepth: z.enum(["Overview", "Balanced", "Deep Dive"]).optional(),
  }),
});

export const evaluatorSchema = z.object({
  body: z.object({
    conceptId: shortId,
    conceptTitle: titleText,
    questions: z
      .array(z.any())
      .min(1, "At least one question is required")
      .max(20, "Cannot submit more than 20 questions"),
    learnerAnswers: z
      .array(
        z.object({
          questionId: shortId.optional(),
          question: z
            .string()
            .min(1)
            .max(1000, "Question text cannot exceed 1000 characters"),
          userAnswer: z
            .string()
            .min(1, "User answer cannot be empty")
            .max(2000, "Answer cannot exceed 2000 characters"),
          correctAnswer: z.string().max(1000).optional(),
        }),
      )
      .min(1, "At least one answer must be submitted")
      .max(20, "Cannot submit more than 20 answers"),
  }),
});

export const plannerSchema = z.object({
  body: z.object({
    workspaceId: shortId,
    availableTimeMinutes: z
      .number()
      .positive()
      .max(1440, "Time cannot exceed 24 hours (1440 mins)")
      .optional(),
  }),
});

export const resourceGeneratorSchema = z.object({
  body: z.object({
    conceptTitle: titleText,
    domain: titleText,
    targetCount: z.number().min(1).max(10).optional(),
  }),
});

export const quizGeneratorSchema = z.object({
  body: z.object({
    conceptTitle: titleText,
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
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Invalid AI Request Payload",
          details: error.issues,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: "Invalid AI Request Payload",
      });
    }
  };
