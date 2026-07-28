import { IAIProvider } from "../providers/provider.interface";
import { EVALUATOR_SYSTEM_PROMPT, buildEvaluatorPrompt } from "./evaluator.prompt";
import { EvaluationResultSchema } from "./evaluator.schema";

export class EvaluatorService {
  constructor(private aiProvider: IAIProvider) {}

  async evaluateSubmission(context: any) {
    const prompt = buildEvaluatorPrompt(context);
    return this.aiProvider.generate(prompt, EVALUATOR_SYSTEM_PROMPT, {
      responseSchema: EvaluationResultSchema,
      temperature: 0.1, // Low temperature for deterministic grading
    });
  }
}