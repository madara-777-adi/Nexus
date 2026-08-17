import { ProviderFactory } from "../providers/provider.factory";
import {
  EVALUATOR_SYSTEM_PROMPT,
  buildEvaluatorPrompt,
} from "./evaluator.prompt";

export class EvaluatorService {
  async evaluateSubmission(context: any) {
    const prompt = buildEvaluatorPrompt(context);

    // Uses Tier2 provider (matches this call's previous "teacher" role mapping).
    const rawData = await ProviderFactory.getInstance()
      .getTier2Provider()
      .generate<any>(prompt, EVALUATOR_SYSTEM_PROMPT, { temperature: 0.1 });

    // Defensive normalization (same pattern as TeacherService): the AI
    // response is never trusted to match the requested shape exactly.
    // ai.controller.ts only ever defaulted masteryScore itself — every other
    // field passed straight through to the frontend. Guarantee all of them
    // here so a partial/malformed LLM response can't reach the UI with a
    // missing key or wrong type.
    const toStringArray = (val: any): string[] =>
      Array.isArray(val) ? val.map((v) => String(v)) : [];

    const masteryScore =
      typeof rawData?.masteryScore === "number"
        ? rawData.masteryScore
        : typeof rawData?.score === "number"
          ? rawData.score
          : typeof rawData?.mastery === "number"
            ? rawData.mastery
            : typeof rawData?.evaluationResult?.masteryPercentage === "number"
              ? rawData.evaluationResult.masteryPercentage
              : 0;

    return {
      masteryScore,
      confidence:
        typeof rawData?.confidence === "number" ? rawData.confidence : 0,
      strengths: toStringArray(rawData?.strengths),
      weaknesses: toStringArray(rawData?.weaknesses),
      misconceptions: toStringArray(rawData?.misconceptions),
      missingPrerequisites: toStringArray(rawData?.missingPrerequisites),
      recommendation: String(rawData?.recommendation || ""),
    };
  }
}

export const evaluatorService = new EvaluatorService();
