import { IAIProvider } from "../providers/provider.interface";
import { PLANNER_SYSTEM_PROMPT, buildPlannerPrompt } from "./planner.prompt";
import { PlannerSchema } from "./planner.schema";

export class PlannerService {
  constructor(private aiProvider: IAIProvider) {}

  async planNextStep(context: any) {
    const prompt = buildPlannerPrompt(context);
    return this.aiProvider.generate(prompt, PLANNER_SYSTEM_PROMPT, {
      responseSchema: PlannerSchema,
      temperature: 0.2,
    });
  }
}