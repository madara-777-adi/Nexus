import { groqProvider } from "../providers/groq.provider";
import { QuizSet, QuizGeneratorContext } from "../types/ai.types";

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

    return groqProvider.generateJSON(
      prompt,
      QUIZ_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 }
    );
  }
}

export const quizGeneratorService = new QuizGeneratorService();