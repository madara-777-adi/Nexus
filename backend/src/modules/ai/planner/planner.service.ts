import { IAIProvider } from "../providers/provider.interface";
import {
  PLANNER_SYSTEM_PROMPT,
  BLUEPRINT_SYSTEM_PROMPT,
  buildPlannerPrompt,
  buildBlueprintPrompt,
} from "./planner.prompt";
import { PlannerSchema, BlueprintSchema } from "./planner.schema";

export class PlannerService {
  constructor(private aiProvider: IAIProvider) {}

  async planNextStep(context: any) {
    const prompt = buildPlannerPrompt(context);
    return this.aiProvider.generate(prompt, PLANNER_SYSTEM_PROMPT, {
      responseSchema: PlannerSchema,
      temperature: 0.2,
    });
  }

  async generateBlueprint(context: { title: string; description?: string }) {
    const prompt = buildBlueprintPrompt(context);
    const response = await this.aiProvider.generate(prompt, BLUEPRINT_SYSTEM_PROMPT, {
      responseSchema: BlueprintSchema,
      temperature: 0.2,
    });

    // Ensure parsing if the provider returns stringified JSON
    if (typeof response === "string") {
      return JSON.parse(response);
    }
    return response;
  }
}