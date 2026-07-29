import { groqProvider } from "../providers/groq.provider";
import { EVALUATOR_SYSTEM_PROMPT, buildEvaluatorPrompt } from "./evaluator.prompt";

export class EvaluatorService {
  async evaluateSubmission(context: any) {
    const prompt = buildEvaluatorPrompt(context);
    return groqProvider.generateJSON(
      prompt,
      EVALUATOR_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.1 } // Low temperature for deterministic evaluation
    );
  }
}

export const evaluatorService = new EvaluatorService();