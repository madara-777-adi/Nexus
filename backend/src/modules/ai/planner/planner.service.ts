import { groqProvider } from "../providers/groq.provider";
import WorkspaceModel from "../../workspace/models/workspace.model";
import ConceptModel from "../../concept/models/concept.model";
import RelationshipModel from "../../relationship/models/relationship.model";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import {
  PLANNER_SYSTEM_PROMPT,
  BLUEPRINT_SYSTEM_PROMPT,
  buildPlannerPrompt,
  buildBlueprintPrompt,
} from "./planner.prompt";

export class PlannerService {
  async planNextStep(context: any) {
    // RC-004 Fix: Resolve workspace to ObjectId before building prompt/processing
    if (context.workspaceId) {
      const workspace = await WorkspaceModel.findOne({
        workspaceId: context.workspaceId,
      });
      if (!workspace) throw new NotFoundError("Workspace not found");
      context.workspaceId = workspace._id;
    }
    const prompt = buildPlannerPrompt(context);
    return groqProvider.generateJSON(
      prompt,
      PLANNER_SYSTEM_PROMPT,
      "organizer",
      { temperature: 0.2 },
    );
  }

  async generateBlueprint(context: { title: string; description?: string }) {
    const prompt = buildBlueprintPrompt(context);
    return groqProvider.generateJSON(
      prompt,
      BLUEPRINT_SYSTEM_PROMPT,
      "organizer",
      { temperature: 0.2 },
    );
  }
}

export const plannerService = new PlannerService();
