import { SchemaType } from "@google/generative-ai";
import { IAIProvider } from "../providers/provider.interface";
import { QuizSet, QuizGeneratorContext } from "../types/ai.types";

const StandaloneQuizSchema = {
  type: SchemaType.OBJECT,
  properties: {
    topic: { type: SchemaType.STRING },
    difficulty: { type: SchemaType.STRING },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          correctIndex: { type: SchemaType.NUMBER },
          explanation: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
        },
        required: ["id", "question", "options", "correctIndex", "explanation"],
      },
    },
  },
  required: ["topic", "difficulty", "questions"],
};

const QUIZ_SYSTEM_PROMPT = `
You are the Diagnostic Quiz Generator for NexusSpace.
Your job is to build conceptual multiple-choice questions that test deep mental understanding rather than memorization.
Output strictly valid JSON matching the specified schema.
`;

export class QuizGeneratorService {
  constructor(private aiProvider: IAIProvider) {}

  async generateQuiz(context: QuizGeneratorContext): Promise<QuizSet> {
    const prompt = `
Generate a conceptual quiz for:
Concept: "${context.conceptTitle}"
Number of Questions: ${context.questionCount || 5}
Target Difficulty: ${context.difficulty || "Intermediate"}

For each question:
- Offer 4 options.
- Assign a unique ID string (e.g., "q_1").
- Provide an intuitive explanation for the correct option.
- Include an optional subtle hint that guides without giving away the answer.
`;

    return this.aiProvider.generate<QuizSet>(prompt, QUIZ_SYSTEM_PROMPT, {
      responseSchema: StandaloneQuizSchema,
      temperature: 0.3,
    });
  }
}