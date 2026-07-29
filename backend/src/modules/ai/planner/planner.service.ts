import { groqProvider } from "../providers/groq.provider";
import {
  PLANNER_SYSTEM_PROMPT,
  BLUEPRINT_SYSTEM_PROMPT,
  buildPlannerPrompt,
  buildBlueprintPrompt,
} from "./planner.prompt";

export class PlannerService {
  async planNextStep(context: any) {
    const prompt = buildPlannerPrompt(context);
    return groqProvider.generateJSON(
      prompt,
      PLANNER_SYSTEM_PROMPT,
      "organizer",
      { temperature: 0.2 }
    );
  }

  async generateBlueprint(context: { title: string; description?: string }) {
    const prompt = buildBlueprintPrompt(context);
    return groqProvider.generateJSON(
      prompt,
      BLUEPRINT_SYSTEM_PROMPT,
      "organizer",
      { temperature: 0.2 }
    );
  }
}

export const plannerService = new PlannerService();