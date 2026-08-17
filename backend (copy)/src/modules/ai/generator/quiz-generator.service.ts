import { ProviderFactory } from "../providers/provider.factory";
import {
  QuizSet,
  QuizGeneratorContext,
  StandaloneQuizQuestion,
} from "../types/ai.types";
import { InternalServerError } from "../../../shared/errors/InternalServerError";

const QUIZ_SYSTEM_PROMPT = `
You are the Diagnostic Quiz Generator for NexusSpace.
Your job is to build conceptual multiple-choice questions that test deep mental understanding rather than memorization.
Output strictly valid JSON matching the specified request structure.
`;

export class QuizGeneratorService {
  async generateQuiz(context: QuizGeneratorContext): Promise<QuizSet> {
    const prompt = `
Generate a conceptual quiz for:
Concept: "${context.conceptTitle}"
Number of Questions: ${context.questionCount || 3}
Target Difficulty: ${context.difficulty || "Intermediate"}

Output strictly valid JSON with this exact layout:
{
  "topic": "${context.conceptTitle}",
  "difficulty": "${context.difficulty || "Intermediate"}",
  "questions": [
    {
      "id": "1",
      "question": "Question text...",
      "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
      "correctIndex": 0,
      "explanation": "Why option 0 is correct...",
      "hint": "Subtle hint..."
    }
  ]
}
`;

    // Uses Tier2 provider (matches this call's previous "teacher" role mapping).
    const rawData = await ProviderFactory.getInstance()
      .getTier2Provider()
      .generate<any>(prompt, QUIZ_SYSTEM_PROMPT, { temperature: 0.3 });

    // Defensive normalization (same pattern as TeacherService): the AI
    // response is never trusted to match the requested shape exactly, so
    // every field is validated/defaulted here before it can reach the
    // controller or the frontend with a missing key or wrong type.
    const rawQuestions = Array.isArray(rawData?.questions)
      ? rawData.questions
      : [];

    const questions: StandaloneQuizQuestion[] = rawQuestions
      .map((q: any, index: number) => ({
        id: String(q?.id ?? index + 1),
        question: String(q?.question || "").trim(),
        options: Array.isArray(q?.options)
          ? q.options.map((opt: any) => String(opt))
          : [],
        correctIndex: typeof q?.correctIndex === "number" ? q.correctIndex : 0,
        explanation: String(q?.explanation || "").trim(),
        hint: q?.hint ? String(q.hint) : undefined,
      }))
      // Drop any question the AI returned without real content instead of
      // shipping a broken quiz row to the frontend.
      .filter(
        (q: StandaloneQuizQuestion) =>
          q.question.length > 0 && q.options.length >= 2,
      );

    if (questions.length === 0) {
      throw new InternalServerError(
        "The AI generator returned an unexpected response. Please try again.",
      );
    }

    return {
      topic: String(rawData?.topic || context.conceptTitle),
      difficulty: String(
        rawData?.difficulty || context.difficulty || "Intermediate",
      ),
      questions,
    };
  }
}

export const quizGeneratorService = new QuizGeneratorService();
