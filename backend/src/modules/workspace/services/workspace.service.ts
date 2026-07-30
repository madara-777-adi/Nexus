import { Types } from "mongoose";
import Workspace, {
  IWorkspace,
  WorkspaceVisibility,
} from "../models/workspace.model";
import Concept from "../../concept/models/concept.model";
import Relationship from "../../relationship/models/relationship.model";
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
} from "../validators/workspace.validator";
import generateUserId from "../../../shared/utils/generateUserId";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ForbiddenError } from "../../../shared/errors/ForbiddenError";
import { PlannerService } from "../../ai/planner/planner.service";

// Instantiate the AI Planner Service
const plannerService = new PlannerService();

class WorkspaceService {
  async createWorkspace(
    ownerObjectId: Types.ObjectId,
    dto: CreateWorkspaceDTO,
  ): Promise<IWorkspace> {
    // 1. Generate unique custom ID
    let workspaceId: string;
    do {
      workspaceId = `ws_${generateUserId()}`;
    } while (await Workspace.exists({ workspaceId }));

    // 2. Create the Workspace document shell
    const workspace = await Workspace.create({
      workspaceId,
      owner: ownerObjectId,
      title: dto.title,
      description: dto.description || "",
      visibility: dto.visibility || WorkspaceVisibility.PRIVATE,
    });

    // 3. Generate initial AI blueprint concepts & relationships using PlannerService
    try {
      console.log(
        `[AI Planner] Generating blueprint for workspace: "${dto.title}"`,
      );

      const planResult = await plannerService.generateBlueprint({
        title: dto.title,
        description:
          dto.description || `Learning curriculum and topics for ${dto.title}`,
      });

      console.log(
        "[AI Planner] Raw output received:",
        JSON.stringify(planResult),
      );

      // Extract concepts array regardless of Groq's JSON nesting structure
      const rawConcepts =
        planResult?.concepts ||
        planResult?.data?.concepts ||
        planResult?.blueprint?.concepts ||
        [];

      const rawRelationships =
        planResult?.relationships ||
        planResult?.data?.relationships ||
        planResult?.blueprint?.relationships ||
        [];

      if (Array.isArray(rawConcepts) && rawConcepts.length > 0) {
        // Map concept lookup keys to Database ObjectIds
        const conceptDocMap = new Map<string, Types.ObjectId>();

        const conceptDocsToInsert = rawConcepts.map((c: any, index: number) => {
          const _id = new Types.ObjectId();
          const conceptId = `concept_${generateUserId()}`;

          // Register multiple keys for safe edge lookup (ID, custom concept ID, or lowercase title)
          const keysToRegister = [
            c.id,
            c.conceptId,
            c.title ? c.title.toLowerCase() : null,
            `step_${index}`,
          ].filter(Boolean);

          keysToRegister.forEach((key) => conceptDocMap.set(key, _id));

          return {
            _id,
            conceptId,
            workspace: workspace._id, // Matches Mongoose ObjectId ref
            owner: ownerObjectId,
            title: c.title || `Module ${index + 1}`,
            description: c.description || "",
          };
        });

        // Bulk insert concepts
        await Concept.insertMany(conceptDocsToInsert);
        console.log(
          `[AI Planner] Successfully inserted ${conceptDocsToInsert.length} concept nodes.`,
        );

        // Map relationships and bulk insert if available
        if (Array.isArray(rawRelationships) && rawRelationships.length > 0) {
          const relationshipDocsToInsert = rawRelationships
            .map((r: any) => {
              const sourceKey =
                r.sourceConceptId ||
                r.source ||
                (r.sourceTitle ? r.sourceTitle.toLowerCase() : "");
              const targetKey =
                r.targetConceptId ||
                r.target ||
                (r.targetTitle ? r.targetTitle.toLowerCase() : "");

              const sourceObjectId = conceptDocMap.get(sourceKey);
              const targetObjectId = conceptDocMap.get(targetKey);

              if (!sourceObjectId || !targetObjectId) return null;

              return {
                relationshipId: `rel_${generateUserId()}`,
                workspace: workspace._id, // Matches Mongoose ObjectId ref
                sourceConcept: sourceObjectId,
                targetConcept: targetObjectId,
                type: r.type || "DEPENDS_ON",
              };
            })
            .filter(Boolean);

          if (relationshipDocsToInsert.length > 0) {
            await Relationship.insertMany(relationshipDocsToInsert);
            console.log(
              `[AI Planner] Successfully inserted ${relationshipDocsToInsert.length} relationship edges.`,
            );
          }
        }
      } else {
        console.warn(
          "[AI Planner] Received empty concept array. Creating default root concept fallback.",
        );
        await this.createFallbackConcept(
          workspace._id,
          ownerObjectId,
          dto.title,
        );
      }
    } catch (aiError) {
      console.error(
        "AI Planner blueprint generation failed during workspace creation:",
        aiError,
      );
      // Fallback: Ensure workspace is populated with a starting node even if AI fails
      await this.createFallbackConcept(workspace._id, ownerObjectId, dto.title);
    }

    return workspace;
  }

  // Helper method to create a core fallback concept when AI output is empty or fails
  private async createFallbackConcept(
    workspaceObjectId: Types.ObjectId,
    ownerObjectId: Types.ObjectId,
    title: string,
  ): Promise<void> {
    try {
      await Concept.create({
        conceptId: `concept_${generateUserId()}`,
        workspace: workspaceObjectId,
        owner: ownerObjectId,
        title: `${title} Fundamentals`,
        description: `Core principles and foundational concepts for ${title}.`,
      });
    } catch (fallbackError) {
      console.error("Failed to create fallback concept:", fallbackError);
    }
  }

  async getUserWorkspaces(
    ownerObjectId: Types.ObjectId,
  ): Promise<IWorkspace[]> {
    return Workspace.find({ owner: ownerObjectId }).sort({ updatedAt: -1 });
  }

  async getWorkspaceById(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findOne({ workspaceId });

    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    const isOwner = workspace.owner.equals(userObjectId);
    if (!isOwner && workspace.visibility === WorkspaceVisibility.PRIVATE) {
      throw new ForbiddenError("Access denied to this private workspace.");
    }

    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userObjectId: Types.ObjectId,
    dto: UpdateWorkspaceDTO,
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findOne({ workspaceId });

    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    if (dto.title !== undefined) workspace.title = dto.title;
    if (dto.description !== undefined) workspace.description = dto.description;
    if (dto.visibility !== undefined) workspace.visibility = dto.visibility;

    await workspace.save();
    return workspace;
  }

  async deleteWorkspace(
    workspaceId: string,
    userObjectId: Types.ObjectId,
  ): Promise<void> {
    const workspace = await Workspace.findOne({ workspaceId });

    if (!workspace) {
      throw new NotFoundError("Workspace not found.");
    }

    if (!workspace.owner.equals(userObjectId)) {
      throw new ForbiddenError("You are not allowed to perform this action.");
    }

    await Workspace.deleteOne({ _id: workspace._id });
  }
}

export default new WorkspaceService();
