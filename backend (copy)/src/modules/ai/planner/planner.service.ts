import { ProviderFactory } from "../providers/provider.factory";
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
    // Uses Tier1 provider (matches this call's previous "organizer" role mapping).
    return ProviderFactory.getInstance()
      .getTier1Provider()
      .generate<any>(prompt, PLANNER_SYSTEM_PROMPT, { temperature: 0.2 });
  }

  async generateBlueprint(context: { title: string; description?: string }) {
    const prompt = buildBlueprintPrompt(context);
    // Uses Tier1 provider (matches this call's previous "organizer" role mapping).
    return ProviderFactory.getInstance()
      .getTier1Provider()
      .generate<any>(prompt, BLUEPRINT_SYSTEM_PROMPT, { temperature: 0.2 });
  }
}

export const plannerService = new PlannerService();